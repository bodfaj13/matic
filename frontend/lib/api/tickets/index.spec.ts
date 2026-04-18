import { apiClient } from '@/lib/api/axios';
import {
  createTicketRequest,
  listTicketsRequest,
  updateTicketRequest,
} from './index';
import { TicketStatus } from '@/lib/enums/ticket-status';

jest.mock('@/lib/api/axios', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
  },
}));

describe('tickets request functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createTicketRequest POSTs /tickets and unwraps data', async () => {
    (apiClient.post as jest.Mock).mockResolvedValueOnce({
      data: { status: true, data: { _id: 't1' } },
    });

    const out = await createTicketRequest({
      title: 'T',
      description: 'D',
      customer_email: 'c@example.com',
    });

    expect(apiClient.post).toHaveBeenCalledWith('/tickets', {
      title: 'T',
      description: 'D',
      customer_email: 'c@example.com',
    });
    expect(out.data?._id).toBe('t1');
  });

  it('listTicketsRequest GETs /tickets with params', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: {
        data: [],
        totalCount: 0,
        pageNumber: 1,
        pageSize: 20,
        totalPages: 1,
      },
    });

    await listTicketsRequest({ page: 2, limit: 10, status: TicketStatus.Open });

    expect(apiClient.get).toHaveBeenCalledWith('/tickets', {
      params: { page: 2, limit: 10, status: TicketStatus.Open },
    });
  });

  it('updateTicketRequest PATCHes /tickets/:id with body', async () => {
    (apiClient.patch as jest.Mock).mockResolvedValueOnce({
      data: {
        status: true,
        data: { _id: 't1', status: TicketStatus.Resolved },
      },
    });

    const out = await updateTicketRequest('t1', {
      status: TicketStatus.Resolved,
    });

    expect(apiClient.patch).toHaveBeenCalledWith('/tickets/t1', {
      status: TicketStatus.Resolved,
    });
    expect(out.data?.status).toBe(TicketStatus.Resolved);
  });
});
