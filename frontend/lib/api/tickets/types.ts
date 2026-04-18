import type { BaseResponse } from '@/lib/api/types';
import type { TicketPriority } from '@/lib/enums/ticket-priority';
import type { TicketStatus } from '@/lib/enums/ticket-status';

export {
  TicketStatus,
  formatTicketStatus,
  isTicketStatus,
  ticketStatusLabel,
  TICKET_STATUS_ORDER,
} from '@/lib/enums/ticket-status';
export {
  TicketPriority,
  formatTicketPriority,
  isTicketPriority,
  ticketPriorityLabel,
  TICKET_PRIORITY_ORDER,
} from '@/lib/enums/ticket-priority';

export type TriageStatus = 'pending' | 'completed' | 'failed';

export type Ticket = {
  _id: string;
  title: string;
  description: string;
  customer_email: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  triageStatus: TriageStatus;
  triageError?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
};

export type TicketsListResponse = BaseResponse<Ticket[]> & {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

export type TicketSingleResponse = BaseResponse<Ticket>;

export type CreateTicketBody = {
  title: string;
  description: string;
  customer_email: string;
};

export type UpdateTicketBody = {
  status: TicketStatus;
};

export type ListTicketsParams = {
  page?: number;
  limit?: number;
  status?: TicketStatus;
  priority?: TicketPriority;
  search?: string;
};
