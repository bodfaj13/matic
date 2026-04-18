import { Job } from 'bullmq';
import { Model } from 'mongoose';
import { TicketPriority } from '../common/enums/ticket-priority.enum';
import { TriageStatus } from '../common/enums/triage-status.enum';
import { TicketDocument } from '../tickets/schemas/ticket.schema';
import { OpenaiTriageService } from './openai-triage.service';
import { TriageProcessor } from './triage.processor';

describe('TriageProcessor', () => {
  let processor: TriageProcessor;
  let ticketModel: {
    findById: jest.Mock;
  };
  let openai: { classify: jest.Mock };

  let ticketDoc: {
    title: string;
    description: string;
    category: string;
    priority: TicketPriority;
    triageStatus?: TriageStatus;
    triageError?: string;
    save: jest.Mock;
  };

  beforeEach(() => {
    ticketDoc = {
      title: 'T',
      description: 'D',
      category: 'General',
      priority: TicketPriority.Medium,
      save: jest.fn().mockResolvedValue(undefined),
    };
    openai = { classify: jest.fn() };
    ticketModel = {
      findById: jest.fn(),
    };
    processor = new TriageProcessor(
      ticketModel as unknown as Model<TicketDocument>,
      openai as unknown as OpenaiTriageService,
    );
  });

  function job(
    data: { ticketId: string },
    opts: { attempts?: number; attemptsMade?: number } = {},
  ): Job<{ ticketId: string }> {
    return {
      data,
      opts: { attempts: opts.attempts ?? 5 },
      attemptsMade: opts.attemptsMade ?? 0,
    } as Job<{ ticketId: string }>;
  }

  it('classifies and marks triage completed', async () => {
    ticketModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(ticketDoc),
    });
    openai.classify.mockResolvedValue({
      category: 'Technical Bug',
      priority: TicketPriority.High,
    });

    await processor.process(job({ ticketId: '507f1f77bcf86cd799439011' }));

    expect(ticketDoc.category).toBe('Technical Bug');
    expect(ticketDoc.priority).toBe(TicketPriority.High);
    expect(ticketDoc.triageStatus).toBe(TriageStatus.Completed);
    expect(ticketDoc.save).toHaveBeenCalled();
  });

  it('returns early when ticket missing', async () => {
    ticketModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });

    await processor.process(job({ ticketId: 'missing' }));

    expect(openai.classify).not.toHaveBeenCalled();
  });

  it('applies fallback on final failed attempt', async () => {
    ticketModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(ticketDoc),
    });
    openai.classify.mockRejectedValue(new Error('LLM down'));

    await processor.process(
      job(
        { ticketId: '507f1f77bcf86cd799439011' },
        { attempts: 3, attemptsMade: 2 },
      ),
    );

    expect(ticketDoc.triageStatus).toBe(TriageStatus.Failed);
    expect(ticketDoc.category).toBe('General');
    expect(ticketDoc.priority).toBe(TicketPriority.Medium);
    expect(ticketDoc.triageError).toBe('LLM down');
  });

  it('rethrows when retries remain', async () => {
    ticketModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(ticketDoc),
    });
    openai.classify.mockRejectedValue(new Error('temporary'));

    await expect(
      processor.process(
        job(
          { ticketId: '507f1f77bcf86cd799439011' },
          { attempts: 5, attemptsMade: 0 },
        ),
      ),
    ).rejects.toThrow('temporary');
  });

  it('clears previous triageError on successful classify', async () => {
    ticketDoc.triageError = 'stale error from earlier attempt';
    ticketModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(ticketDoc),
    });
    openai.classify.mockResolvedValue({
      category: 'Billing',
      priority: TicketPriority.Low,
    });

    await processor.process(job({ ticketId: '507f1f77bcf86cd799439011' }));

    expect(ticketDoc.triageError).toBeUndefined();
    expect(ticketDoc.triageStatus).toBe(TriageStatus.Completed);
  });

  it('propagates ticket.save() rejection on the success path so BullMQ can retry', async () => {
    ticketModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(ticketDoc),
    });
    openai.classify.mockResolvedValue({
      category: 'Billing',
      priority: TicketPriority.Medium,
    });
    ticketDoc.save.mockRejectedValueOnce(new Error('mongo write failed'));

    await expect(
      processor.process(job({ ticketId: '507f1f77bcf86cd799439011' })),
    ).rejects.toThrow('mongo write failed');
  });

  it('propagates ticket.save() rejection on the exhausted-retries fallback path', async () => {
    ticketModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(ticketDoc),
    });
    openai.classify.mockRejectedValue(new Error('LLM down'));
    ticketDoc.save.mockRejectedValueOnce(new Error('mongo write failed'));

    await expect(
      processor.process(
        job(
          { ticketId: '507f1f77bcf86cd799439011' },
          { attempts: 3, attemptsMade: 2 },
        ),
      ),
    ).rejects.toThrow('mongo write failed');
  });

  it('defaults job.opts.attempts to 5 when undefined', async () => {
    ticketModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(ticketDoc),
    });
    openai.classify.mockRejectedValue(new Error('boom'));

    const noAttemptsJob = {
      data: { ticketId: '507f1f77bcf86cd799439011' },
      opts: {},
      attemptsMade: 4,
    } as Job<{ ticketId: string }>;

    await processor.process(noAttemptsJob);
    expect(ticketDoc.triageStatus).toBe(TriageStatus.Failed);
    expect(ticketDoc.category).toBe('General');
  });

  it('handles non-Error rejection from classify and still records fallback', async () => {
    ticketModel.findById.mockReturnValue({
      exec: jest.fn().mockResolvedValue(ticketDoc),
    });
    openai.classify.mockRejectedValue('string rejection');

    await processor.process(
      job(
        { ticketId: '507f1f77bcf86cd799439011' },
        { attempts: 1, attemptsMade: 0 },
      ),
    );

    expect(ticketDoc.triageStatus).toBe(TriageStatus.Failed);
    expect(ticketDoc.triageError).toBe('string rejection');
  });
});
