'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { showError } from '@/app/utils/toast-helpers';
import {
  createTicketRequest,
  listTicketsRequest,
  updateTicketRequest,
} from '@/lib/api/tickets/index';
import type {
  CreateTicketBody,
  ListTicketsParams,
  Ticket,
  TicketsListResponse,
  UpdateTicketBody,
} from '@/lib/api/tickets/types';

export const ticketsQueryKey = (params: ListTicketsParams) =>
  ['tickets', params] as const;

export function useTicketsQuery(
  params: ListTicketsParams,
  options?: {
    enabled?: boolean;
    refetchInterval?: number | false;
  },
) {
  return useQuery({
    queryKey: ticketsQueryKey(params),
    queryFn: () => listTicketsRequest(params),
    placeholderData: keepPreviousData,
    enabled: options?.enabled ?? true,
    refetchInterval:
      options?.refetchInterval !== undefined
        ? options.refetchInterval
        : (query) => {
            // Poll while the LLM worker is still classifying tickets in the
            // background; stop once every visible ticket has settled.
            const raw = query.state.data as TicketsListResponse | undefined;
            const list = raw?.data ?? [];
            return ticketsHavePendingTriage(list) ? 4000 : false;
          },
    select: (res) => ({
      tickets: res.data ?? [],
      totalCount: res.totalCount,
      pageNumber: res.pageNumber,
      pageSize: res.pageSize,
      totalPages: res.totalPages,
      message: res.message,
    }),
  });
}

export function useCreateTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateTicketBody) => createTicketRequest(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

type UpdateTicketSnapshots = Array<
  [readonly unknown[], TicketsListResponse | undefined]
>;

export function useUpdateTicketMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof updateTicketRequest>>,
    Error,
    { id: string; body: UpdateTicketBody },
    { snapshots: UpdateTicketSnapshots }
  >({
    mutationFn: ({ id, body }) => updateTicketRequest(id, body),
    onMutate: async ({ id, body }) => {
      // Snapshot every cached tickets list (paginated/filtered keys all live
      // under the same prefix) so we can patch them all optimistically and
      // restore them all on error.
      await queryClient.cancelQueries({ queryKey: ['tickets'] });
      const snapshots = queryClient.getQueriesData<TicketsListResponse>({
        queryKey: ['tickets'],
      });
      snapshots.forEach(([key, prev]) => {
        if (!prev?.data) return;
        queryClient.setQueryData<TicketsListResponse>(key, {
          ...prev,
          data: prev.data.map((t) => (t._id === id ? { ...t, ...body } : t)),
        });
      });
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots.forEach(([key, prev]) => {
        queryClient.setQueryData(key, prev);
      });
      showError("Couldn't update ticket. Reverted.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function ticketsHavePendingTriage(tickets: Ticket[]): boolean {
  return tickets.some((t) => t.triageStatus === 'pending');
}
