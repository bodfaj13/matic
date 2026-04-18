import { Test, TestingModule } from '@nestjs/testing';
import { TicketStatus } from '../common/enums/ticket-status.enum';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

describe('TicketsController', () => {
  let controller: TicketsController;
  const ticketsService = {
    create: jest.fn(),
    findPage: jest.fn(),
    updateStatus: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketsController],
      providers: [{ provide: TicketsService, useValue: ticketsService }],
    }).compile();

    controller = module.get(TicketsController);
  });

  it('create forwards to service', async () => {
    const dto = {
      title: 'x',
      description: 'y',
      customer_email: 'c@e.com',
    };
    ticketsService.create.mockResolvedValue({
      message: 'ok',
      status: true,
      data: { _id: '1' },
      statusCode: '201',
    });

    await expect(controller.create(dto)).resolves.toMatchObject({
      data: { _id: '1' },
    });
    expect(ticketsService.create).toHaveBeenCalledWith(dto);
  });

  it('findAll forwards query to service', async () => {
    const q = { page: 1, limit: 5 };
    ticketsService.findPage.mockResolvedValue({
      message: 'ok',
      status: true,
      data: [],
      totalCount: 0,
      pageNumber: 1,
      pageSize: 5,
      totalPages: 1,
      statusCode: '200',
    });

    await controller.findAll(q);
    expect(ticketsService.findPage).toHaveBeenCalledWith(q);
  });

  it('update forwards id and dto', async () => {
    ticketsService.updateStatus.mockResolvedValue({
      message: 'ok',
      status: true,
      data: { status: TicketStatus.Open },
      statusCode: '200',
    });

    await controller.update('abc', { status: TicketStatus.Open });
    expect(ticketsService.updateStatus).toHaveBeenCalledWith('abc', {
      status: TicketStatus.Open,
    });
  });
});
