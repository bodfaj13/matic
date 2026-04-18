import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { TicketCategory } from '../common/enums/ticket-category.enum';
import { TicketPriority } from '../common/enums/ticket-priority.enum';
import { TriageStatus } from '../common/enums/triage-status.enum';
import { Ticket, TicketDocument } from '../tickets/schemas/ticket.schema';
import { OpenaiTriageService } from './openai-triage.service';

@Injectable()
@Processor('triage')
export class TriageProcessor extends WorkerHost {
  private readonly logger = new Logger(TriageProcessor.name);

  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    private readonly openaiTriage: OpenaiTriageService,
  ) {
    super();
  }

  async process(job: Job<{ ticketId: string }>): Promise<void> {
    const { ticketId } = job.data;
    const ticket = await this.ticketModel.findById(ticketId).exec();
    if (!ticket) {
      this.logger.warn(`Ticket ${ticketId} not found; skipping triage`);
      return;
    }

    try {
      const { category, priority } = await this.openaiTriage.classify(
        ticket.title,
        ticket.description,
      );
      ticket.category = category;
      ticket.priority = priority;
      ticket.triageStatus = TriageStatus.Completed;
      ticket.triageError = undefined;
      await ticket.save();
    } catch (err: unknown) {
      const maxAttempts = job.opts.attempts ?? 5;
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Triage attempt ${job.attemptsMade + 1}/${maxAttempts} failed for ${ticketId}: ${message}`,
      );

      // Final attempt: persist a safe-default classification so the ticket
      // stays workable in the UI. Earlier attempts rethrow so BullMQ retries.
      if (job.attemptsMade >= maxAttempts - 1) {
        ticket.category = TicketCategory.General;
        ticket.priority = TicketPriority.Medium;
        ticket.triageStatus = TriageStatus.Failed;
        ticket.triageError = message;
        await ticket.save();
        return;
      }

      throw err;
    }
  }
}
