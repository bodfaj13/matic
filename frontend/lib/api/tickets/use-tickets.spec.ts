import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { showError } from '@/app/utils/toast-helpers';
import {
  createTicketRequest,
  listTicketsRequest,
  updateTicketRequest,
} from '@/lib/api/tickets/index';
import {
  ticketsHavePendingTriage,
  useCreateTicketMutation,
  useTicketsQuery,
  useUpdateTicketMutation,
} from '@/lib/api/tickets/use-tickets';
import type { Ticket, TicketsListResponse } from '@/lib/api/tickets/types';
import { TicketPriority } from '@/lib/enums/ticket-priority';
import { TicketStatus } from '@/lib/enums/ticket-status';

jest.mock('@/lib/api/tickets/index', () => ({
  updateTicketRequest: jest.fn(),
  createTicketRequest: jest.fn(),
  listTicketsRequest: jest.fn(),
}));

jest.mock('@/app/utils/toast-helpers', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
  showInfo: jest.fn(),
  showWarning: jest.fn(),
  showLoading: jest.fn(),
  dismissToast: jest.fn(),
  showPromise: jest.fn(),
}));

const updateTicketRequestMock = updateTicketRequest as jest.MockedFunction<
  typeof updateTicketRequest
>;
const createTicketRequestMock = createTicketRequest as jest.MockedFunction<
  typeof createTicketRequest
>;
const listTicketsRequestMock = listTicketsRequest as jest.MockedFunction<
  typeof listTicketsRequest
>;
const showErrorMock = showError as jest.MockedFunction<typeof showError>;

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    _id: 't1',
    title: 'Card declined',
    description: 'Customer reports card decline',
    customer_email: 'c@example.com',
    status: TicketStatus.Open,
    priority: TicketPriority.Medium,
    category: 'Billing',
    triageStatus: 'completed',
    ...overrides,
  };
}

function seededList(tickets: Ticket[]): TicketsListResponse {
  return {
    status: true,
    statusCode: '200',
    data: tickets,
    totalCount: tickets.length,
    pageNumber: 1,
    pageSize: 20,
    totalPages: 1,
  };
}

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

describe('useUpdateTicketMutation — optimistic updates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('optimistically patches every cached tickets list before the request resolves', async () => {
    const ticketA = makeTicket({ _id: 'a', status: TicketStatus.Open });
    const ticketB = makeTicket({ _id: 'b', status: TicketStatus.Open });

    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const seedKeyOne = ['tickets', { page: 1, limit: 20 }] as const;
    const seedKeyTwo = [
      'tickets',
      { page: 1, limit: 20, status: TicketStatus.Open },
    ] as const;
    client.setQueryData<TicketsListResponse>(
      seedKeyOne,
      seededList([ticketA, ticketB]),
    );
    client.setQueryData<TicketsListResponse>(
      seedKeyTwo,
      seededList([ticketA, ticketB]),
    );

    let resolveRequest: (value: { data: Ticket }) => void = () => {};
    updateTicketRequestMock.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve as (value: { data: Ticket }) => void;
      }) as ReturnType<typeof updateTicketRequest>,
    );

    const { result } = renderHook(() => useUpdateTicketMutation(), {
      wrapper: makeWrapper(client),
    });

    let mutationPromise: Promise<unknown> = Promise.resolve();
    act(() => {
      mutationPromise = result.current.mutateAsync({
        id: 'a',
        body: { status: TicketStatus.InProgress },
      });
    });

    await waitFor(() => {
      const cached = client.getQueryData<TicketsListResponse>(seedKeyOne);
      expect(cached?.data?.find((t) => t._id === 'a')?.status).toBe(
        TicketStatus.InProgress,
      );
    });

    const cachedTwo = client.getQueryData<TicketsListResponse>(seedKeyTwo);
    expect(cachedTwo?.data?.find((t) => t._id === 'a')?.status).toBe(
      TicketStatus.InProgress,
    );
    expect(cachedTwo?.data?.find((t) => t._id === 'b')?.status).toBe(
      TicketStatus.Open,
    );

    resolveRequest({ data: { ...ticketA, status: TicketStatus.InProgress } });
    await mutationPromise;
  });

  it('invalidates the tickets queries after the request settles', async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    client.setQueryData<TicketsListResponse>(
      ['tickets', { page: 1 }],
      seededList([makeTicket()]),
    );
    updateTicketRequestMock.mockResolvedValueOnce({
      data: makeTicket(),
    } as never);

    const { result } = renderHook(() => useUpdateTicketMutation(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 't1',
        body: { status: TicketStatus.Resolved },
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tickets'] });
  });

  it('rolls back every snapshot and shows an error toast when the request fails', async () => {
    const ticketA = makeTicket({ _id: 'a', status: TicketStatus.Open });
    const ticketB = makeTicket({ _id: 'b', status: TicketStatus.Resolved });
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const seedKey = ['tickets', { page: 1 }] as const;
    const original = seededList([ticketA, ticketB]);
    client.setQueryData<TicketsListResponse>(seedKey, original);

    updateTicketRequestMock.mockRejectedValueOnce(new Error('server boom'));

    const { result } = renderHook(() => useUpdateTicketMutation(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          id: 'a',
          body: { status: TicketStatus.Resolved },
        }),
      ).rejects.toThrow('server boom');
    });

    const cached = client.getQueryData<TicketsListResponse>(seedKey);
    expect(cached).toEqual(original);
    expect(showErrorMock).toHaveBeenCalledWith(
      expect.stringContaining('Reverted'),
    );
  });

  it("skips cache entries that don't have a data array", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const seedKey = ['tickets', { page: 1 }] as const;
    client.setQueryData(seedKey, undefined);
    updateTicketRequestMock.mockResolvedValueOnce({
      data: makeTicket(),
    } as never);

    const { result } = renderHook(() => useUpdateTicketMutation(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({
        id: 't1',
        body: { status: TicketStatus.Resolved },
      });
    });

    expect(client.getQueryData(seedKey)).toBeUndefined();
  });
});

describe('useCreateTicketMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("invalidates ['tickets'] queries after a successful create", async () => {
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');
    createTicketRequestMock.mockResolvedValueOnce({
      data: makeTicket(),
    } as never);

    const { result } = renderHook(() => useCreateTicketMutation(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({
        title: 'T',
        description: 'D',
        customer_email: 'c@example.com',
      });
    });

    expect(createTicketRequestMock).toHaveBeenCalled();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tickets'] });
  });
});

describe('useTicketsQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches tickets with the given params and reshapes the response via select', async () => {
    listTicketsRequestMock.mockResolvedValueOnce(seededList([makeTicket()]));
    const client = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const { result } = renderHook(
      () => useTicketsQuery({ page: 1, limit: 20 }),
      { wrapper: makeWrapper(client) },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listTicketsRequestMock).toHaveBeenCalledWith({ page: 1, limit: 20 });
    expect(result.current.data?.tickets).toHaveLength(1);
    expect(result.current.data?.totalCount).toBe(1);
  });

  it('does not fetch when enabled is false', async () => {
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    renderHook(() => useTicketsQuery({ page: 1 }, { enabled: false }), {
      wrapper: makeWrapper(client),
    });

    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(listTicketsRequestMock).not.toHaveBeenCalled();
  });
});

describe('ticketsHavePendingTriage', () => {
  it('returns true when at least one ticket is pending triage', () => {
    expect(
      ticketsHavePendingTriage([
        makeTicket({ triageStatus: 'completed' }),
        makeTicket({ _id: 'x', triageStatus: 'pending' }),
      ]),
    ).toBe(true);
  });

  it('returns false when no ticket is pending', () => {
    expect(
      ticketsHavePendingTriage([
        makeTicket({ triageStatus: 'completed' }),
        makeTicket({ _id: 'y', triageStatus: 'failed' }),
      ]),
    ).toBe(false);
  });

  it('returns false for an empty list', () => {
    expect(ticketsHavePendingTriage([])).toBe(false);
  });
});
