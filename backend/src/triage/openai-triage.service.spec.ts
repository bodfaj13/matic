jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import OpenAI from 'openai';
import { TicketCategory } from '../common/enums/ticket-category.enum';
import { TicketPriority } from '../common/enums/ticket-priority.enum';
import { OpenaiTriageService } from './openai-triage.service';

function respondWith(payload: unknown) {
  return {
    choices: [
      {
        message: {
          content:
            typeof payload === 'string' ? payload : JSON.stringify(payload),
        },
      },
    ],
  };
}

const MockedOpenAI = OpenAI as jest.MockedClass<typeof OpenAI>;

describe('OpenaiTriageService', () => {
  let service: OpenaiTriageService;
  let createMock: jest.Mock;

  beforeEach(async () => {
    createMock = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              category: 'Billing',
              priority: 'high',
            }),
          },
        },
      ],
    });

    MockedOpenAI.mockImplementation(
      () =>
        ({
          chat: {
            completions: {
              create: createMock,
            },
          },
        }) as unknown as OpenAI,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenaiTriageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: string) => {
              if (key === 'OPENAI_API_KEY') {
                return 'sk-test';
              }
              if (key === 'OPENAI_TRIAGE_MODEL') {
                return def ?? 'gpt-4o-mini';
              }
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(OpenaiTriageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns parsed category and priority from LLM JSON', async () => {
    const result = await service.classify('Invoice', 'Wrong amount');

    expect(result).toEqual({
      category: 'Billing',
      priority: TicketPriority.High,
    });
    expect(createMock).toHaveBeenCalled();
  });

  it('throws when API key is missing', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenaiTriageService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(undefined) },
        },
      ],
    }).compile();

    const svc = module.get(OpenaiTriageService);
    await expect(svc.classify('a', 'b')).rejects.toThrow('OPENAI_API_KEY');
  });

  it('throws "Invalid JSON from LLM" when response is not valid JSON', async () => {
    createMock.mockResolvedValueOnce(respondWith('not json at all'));
    await expect(service.classify('a', 'b')).rejects.toThrow(
      'Invalid JSON from LLM',
    );
  });

  it('throws "Empty LLM response" when content is missing', async () => {
    createMock.mockResolvedValueOnce({
      choices: [{ message: { content: '' } }],
    });
    await expect(service.classify('a', 'b')).rejects.toThrow(
      'Empty LLM response',
    );
  });

  it('throws "Empty LLM response" when choices is empty', async () => {
    createMock.mockResolvedValueOnce({ choices: [] });
    await expect(service.classify('a', 'b')).rejects.toThrow(
      'Empty LLM response',
    );
  });

  it('falls back to General when category is unknown', async () => {
    createMock.mockResolvedValueOnce(
      respondWith({ category: 'Mystery', priority: 'high' }),
    );
    const result = await service.classify('a', 'b');
    expect(result.category).toBe(TicketCategory.General);
    expect(result.priority).toBe(TicketPriority.High);
  });

  it('falls back to General when category is missing or blank', async () => {
    createMock.mockResolvedValueOnce(respondWith({ priority: 'low' }));
    const result = await service.classify('a', 'b');
    expect(result.category).toBe(TicketCategory.General);
    expect(result.priority).toBe(TicketPriority.Low);
  });

  it('falls back to Medium when priority is missing', async () => {
    createMock.mockResolvedValueOnce(respondWith({ category: 'Billing' }));
    const result = await service.classify('a', 'b');
    expect(result.category).toBe(TicketCategory.Billing);
    expect(result.priority).toBe(TicketPriority.Medium);
  });

  it('falls back to Medium when priority is an unknown value', async () => {
    createMock.mockResolvedValueOnce(
      respondWith({ category: 'Billing', priority: 'urgent' }),
    );
    const result = await service.classify('a', 'b');
    expect(result.priority).toBe(TicketPriority.Medium);
  });

  it('lowercases mixed-case priority before matching', async () => {
    createMock.mockResolvedValueOnce(
      respondWith({ category: 'Security', priority: 'HIGH' }),
    );
    const result = await service.classify('a', 'b');
    expect(result.priority).toBe(TicketPriority.High);
  });

  it('trims whitespace around category before matching', async () => {
    createMock.mockResolvedValueOnce(
      respondWith({ category: '  Security  ', priority: 'medium' }),
    );
    const result = await service.classify('a', 'b');
    expect(result.category).toBe(TicketCategory.Security);
  });

  it('propagates OpenAI client rejection so the processor can retry', async () => {
    createMock.mockRejectedValueOnce(new Error('network error'));
    await expect(service.classify('a', 'b')).rejects.toThrow('network error');
  });

  it('uses configured model name when provided', async () => {
    const customModule: TestingModule = await Test.createTestingModule({
      providers: [
        OpenaiTriageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: string) => {
              if (key === 'OPENAI_API_KEY') return 'sk-test';
              if (key === 'OPENAI_TRIAGE_MODEL') return 'gpt-5-mini';
              return def;
            }),
          },
        },
      ],
    }).compile();

    const svc = customModule.get(OpenaiTriageService);
    await svc.classify('a', 'b');

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: 'gpt-5-mini' }),
    );
  });
});
