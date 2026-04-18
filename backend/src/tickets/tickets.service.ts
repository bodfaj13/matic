import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import type { Queue } from 'bullmq';
import { Ticket, TicketDocument } from './schemas/ticket.schema';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { QueryTicketsDto } from './dto/query-tickets.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import type { TicketResponseDto } from './dto/ticket-data.response.dto';
import type {
  TicketSingleResponseDto,
  TicketsPaginatedResponseDto,
} from './dto/ticket-envelope.response.dto';
import { TriageStatus } from '../common/enums/triage-status.enum';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name)
    private readonly ticketModel: Model<TicketDocument>,
    @InjectQueue('triage') private readonly triageQueue: Queue,
  ) {}

  async create(dto: CreateTicketDto): Promise<TicketSingleResponseDto> {
    const ticket = await this.ticketModel.create({
      title: dto.title,
      description: dto.description,
      customer_email: dto.customer_email.toLowerCase(),
      triageStatus: TriageStatus.Pending,
    });

    await this.triageQueue.add(
      'classify',
      { ticketId: ticket._id.toString() },
      {
        removeOnComplete: true,
        attempts: 5,
        backoff: { type: 'exponential', delay: 1000 },
      },
    );

    return {
      message: 'Ticket created successfully',
      status: true,
      data: this.ticketToData(ticket),
      statusCode: '201',
    };
  }

  async findPage(query: QueryTicketsDto): Promise<TicketsPaginatedResponseDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const filter: Record<string, unknown> = {};
    if (query.status) {
      filter.status = query.status;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }

    const search = query.search?.trim();
    if (search) {
      const pattern = escapeRegExp(search);
      filter.$or = [
        { title: { $regex: pattern, $options: 'i' } },
        { description: { $regex: pattern, $options: 'i' } },
        { customer_email: { $regex: pattern, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.ticketModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .exec(),
      this.ticketModel.countDocuments(filter).exec(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    return {
      message: 'Tickets retrieved successfully',
      status: true,
      data: items as unknown as TicketResponseDto[],
      totalCount: total,
      pageNumber: page,
      pageSize: limit,
      totalPages,
      statusCode: '200',
    };
  }

  async updateStatus(
    id: string,
    dto: UpdateTicketDto,
  ): Promise<TicketSingleResponseDto> {
    const ticket = await this.ticketModel
      .findByIdAndUpdate(
        id,
        { status: dto.status },
        { returnDocument: 'after' },
      )
      .exec();
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return {
      message: 'Ticket updated successfully',
      status: true,
      data: this.ticketToData(ticket),
      statusCode: '200',
    };
  }

  private ticketToData(
    ticket: TicketDocument | Record<string, unknown>,
  ): TicketResponseDto {
    if (
      ticket &&
      typeof ticket === 'object' &&
      'toObject' in ticket &&
      typeof (ticket as TicketDocument).toObject === 'function'
    ) {
      return (
        ticket as TicketDocument
      ).toObject() as unknown as TicketResponseDto;
    }
    return ticket as unknown as TicketResponseDto;
  }
}
