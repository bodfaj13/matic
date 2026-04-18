import { apiClient } from '@/lib/api/axios';
import type {
  CreateTicketBody,
  ListTicketsParams,
  TicketSingleResponse,
  TicketsListResponse,
  UpdateTicketBody,
} from '@/lib/api/tickets/types';

export async function createTicketRequest(
  body: CreateTicketBody,
): Promise<TicketSingleResponse> {
  const { data } = await apiClient.post<TicketSingleResponse>('/tickets', body);
  return data;
}

export async function listTicketsRequest(
  params: ListTicketsParams,
): Promise<TicketsListResponse> {
  const { data } = await apiClient.get<TicketsListResponse>('/tickets', {
    params,
  });
  return data;
}

export async function updateTicketRequest(
  id: string,
  body: UpdateTicketBody,
): Promise<TicketSingleResponse> {
  const { data } = await apiClient.patch<TicketSingleResponse>(
    `/tickets/${id}`,
    body,
  );
  return data;
}
