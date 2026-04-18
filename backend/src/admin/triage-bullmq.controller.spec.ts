import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { TriageBullMqController } from './triage-bullmq.controller';

describe('TriageBullMqController', () => {
  let controller: TriageBullMqController;
  const getJobCounts = jest.fn().mockResolvedValue({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    paused: 0,
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TriageBullMqController],
      providers: [
        {
          provide: getQueueToken('triage'),
          useValue: { getJobCounts },
        },
      ],
    }).compile();

    controller = module.get(TriageBullMqController);
  });

  it('returns queue job counts', async () => {
    await expect(controller.stats()).resolves.toEqual(
      expect.objectContaining({ waiting: 0 }),
    );
    expect(getJobCounts).toHaveBeenCalled();
  });
});
