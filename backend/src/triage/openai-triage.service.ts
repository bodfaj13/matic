import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { TicketCategory } from '../common/enums/ticket-category.enum';
import { TicketPriority } from '../common/enums/ticket-priority.enum';

const PRIORITIES = new Set<string>(Object.values(TicketPriority));
const CATEGORIES = new Set<string>(Object.values(TicketCategory));

@Injectable()
export class OpenaiTriageService {
  constructor(private readonly config: ConfigService) {}

  async classify(
    title: string,
    description: string,
  ): Promise<{ category: TicketCategory; priority: TicketPriority }> {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const model = this.config.get<string>('OPENAI_TRIAGE_MODEL', 'gpt-4o-mini');
    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You classify support tickets. Reply with a JSON object only: {"category": string, "priority": "high"|"medium"|"low"}.
Category must be one of: Billing, Technical Bug, Feature Request, General, Account, Security.
Use the ticket title and description to decide.`,
        },
        {
          role: 'user',
          content: `Title: ${title}\n\nDescription:\n${description}`,
        },
      ],
    });

    const text = response.choices[0]?.message?.content;
    if (!text) {
      throw new Error('Empty LLM response');
    }

    let parsed: { category?: string; priority?: string };
    try {
      parsed = JSON.parse(text) as { category?: string; priority?: string };
    } catch {
      throw new Error('Invalid JSON from LLM');
    }

    // LLM output is untrusted: silently fall back to safe defaults if it
    // returns a value outside our enum rather than failing the whole job.
    let category: TicketCategory = TicketCategory.General;
    const rawCategory =
      typeof parsed.category === 'string' && parsed.category.trim().length > 0
        ? parsed.category.trim()
        : TicketCategory.General;
    if (CATEGORIES.has(rawCategory)) {
      category = rawCategory as TicketCategory;
    }

    let priority = TicketPriority.Medium;
    const p =
      typeof parsed.priority === 'string' ? parsed.priority.toLowerCase() : '';
    if (PRIORITIES.has(p)) {
      priority = p as TicketPriority;
    }

    return { category, priority };
  }
}
