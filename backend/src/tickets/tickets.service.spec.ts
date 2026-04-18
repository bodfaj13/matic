import { NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { getQueueToken } from '@nestjs/bullmq';
import { Test, TestingModule } from '@nestjs/testing';
import { TicketPriority } from '../common/enums/ticket-priority.enum';
import { TicketStatus } from '../common/enums/ticket-status.enum';
import { TriageStatus } from '../common/enums/triage-status.enum';
import { Ticket } from './schemas/ticket.schema';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  let service: TicketsService;
  let ticketModel: {
    create: jest.Mock;
    find: jest.Mock;
    countDocuments: jest.Mock;
    findByIdAndUpdate: jest.Mock;
  };
  let triageQueue: { add: jest.Mock };
  let findChain: {
    sort: jest.Mock;
    skip: jest.Mock;
    limit: jest.Mock;
    lean: jest.Mock;
    exec: jest.Mock;
  };

  beforeEach(async () => {
    findChain = {
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    ticketModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnValue(findChain),
      countDocuments: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }),
      findByIdAndUpdate: jest.fn(),
    };
    triageQueue = { add: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TicketsService,
        { provide: getModelToken(Ticket.name), useValue: ticketModel },
        { provide: getQueueToken('triage'), useValue: triageQueue },
      ],
    }).compile();

    service = module.get(TicketsService);
  });

  describe('create', () => {
    it('persists ticket and enqueues triage job', async () => {
      const doc = {
        _id: { toString: () => 'tid' },
        title: 'T',
        triageStatus: TriageStatus.Pending,
      };
      ticketModel.create.mockResolvedValue(doc);

      const result = await service.create({
        title: 'T',
        description: 'D',
        customer_email: 'C@EXAMPLE.COM',
      });

      expect(ticketModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          customer_email: 'c@example.com',
          triageStatus: TriageStatus.Pending,
        }),
      );
      expect(triageQueue.add).toHaveBeenCalledWith(
        'classify',
        { ticketId: 'tid' },
        expect.objectContaining({ attempts: 5 }),
      );
      expect(result.status).toBe(true);
      expect(result.statusCode).toBe('201');
      expect(result.data).toEqual(doc);
    });

    it('enqueues with exponential backoff and removeOnComplete', async () => {
      const doc = {
        _id: { toString: () => 'tid' },
        title: 'T',
        triageStatus: TriageStatus.Pending,
      };
      ticketModel.create.mockResolvedValue(doc);

      await service.create({
        title: 'T',
        description: 'D',
        customer_email: 'c@example.com',
      });

      expect(triageQueue.add).toHaveBeenCalledWith(
        'classify',
        { ticketId: 'tid' },
        {
          removeOnComplete: true,
          attempts: 5,
          backoff: { type: 'exponential', delay: 1000 },
        },
      );
    });

    it('propagates queue.add failure after ticket is persisted', async () => {
      const doc = {
        _id: { toString: () => 'tid' },
        title: 'T',
        triageStatus: TriageStatus.Pending,
      };
      ticketModel.create.mockResolvedValue(doc);
      triageQueue.add.mockRejectedValueOnce(new Error('redis unavailable'));

      await expect(
        service.create({
          title: 'T',
          description: 'D',
          customer_email: 'c@example.com',
        }),
      ).rejects.toThrow('redis unavailable');
      expect(ticketModel.create).toHaveBeenCalled();
    });
  });

  describe('findPage', () => {
    it('applies filters and returns meta', async () => {
      findChain.exec.mockResolvedValue([{ _id: '1' }]);
      ticketModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(1),
      });

      const result = await service.findPage({
        page: 2,
        limit: 10,
        status: TicketStatus.Open,
        priority: TicketPriority.High,
      });

      expect(ticketModel.find).toHaveBeenCalledWith({
        status: TicketStatus.Open,
        priority: TicketPriority.High,
      });
      expect(result.pageNumber).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.totalCount).toBe(1);
      expect(result.totalPages).toBe(1);
      expect(result.data).toEqual([{ _id: '1' }]);
    });

    it('defaults to page 1 limit 20 when unspecified', async () => {
      findChain.exec.mockResolvedValue([]);
      ticketModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      const result = await service.findPage({});

      expect(result.pageNumber).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(1);
      expect(findChain.skip).toHaveBeenCalledWith(0);
      expect(findChain.limit).toHaveBeenCalledWith(20);
    });

    it('combines status, priority, and search into a single AND filter with $or search', async () => {
      findChain.exec.mockResolvedValue([]);
      ticketModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await service.findPage({
        status: TicketStatus.Open,
        priority: TicketPriority.High,
        search: 'refund',
      });

      expect(ticketModel.find).toHaveBeenCalledWith({
        status: TicketStatus.Open,
        priority: TicketPriority.High,
        $or: [
          { title: { $regex: 'refund', $options: 'i' } },
          { description: { $regex: 'refund', $options: 'i' } },
          { customer_email: { $regex: 'refund', $options: 'i' } },
        ],
      });
    });

    it('escapes regex metacharacters in search so "a.b" matches literally', async () => {
      findChain.exec.mockResolvedValue([]);
      ticketModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(0),
      });

      await service.findPage({ search: 'a.b+c' });

      type SearchFindArg = {
        $or: Array<{ title: { $regex: string } }>;
      };
      const findCalls = ticketModel.find.mock.calls as [SearchFindArg][];
      const call = findCalls[0][0];
      expect(call.$or[0].title.$regex).toBe('a\\.b\\+c');
    });

    it('rounds up totalPages when total exceeds a single page', async () => {
      findChain.exec.mockResolvedValue([]);
      ticketModel.countDocuments.mockReturnValue({
        exec: jest.fn().mockResolvedValue(25),
      });

      const result = await service.findPage({ page: 1, limit: 10 });

      expect(result.totalPages).toBe(3);
    });
  });

  describe('updateStatus', () => {
    it('returns updated ticket', async () => {
      const updated = { status: TicketStatus.Resolved };
      ticketModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updated),
      });

      const out = await service.updateStatus('id1', {
        status: TicketStatus.Resolved,
      });
      expect(out.data).toEqual(updated);
      expect(out.statusCode).toBe('200');
    });

    it('throws NotFoundException when missing', async () => {
      ticketModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(
        service.updateStatus('missing', { status: TicketStatus.Open }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
