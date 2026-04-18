export enum TicketStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Resolved = 'resolved',
}

export const TICKET_STATUS_ORDER = [
  TicketStatus.Open,
  TicketStatus.InProgress,
  TicketStatus.Resolved,
] as const;

export const ticketStatusLabel: Record<TicketStatus, string> = {
  [TicketStatus.Open]: 'Open',
  [TicketStatus.InProgress]: 'In progress',
  [TicketStatus.Resolved]: 'Resolved',
};

export function formatTicketStatus(status: TicketStatus): string {
  return ticketStatusLabel[status];
}

const statusValueSet = new Set<string>(Object.values(TicketStatus));

export function isTicketStatus(value: string): value is TicketStatus {
  return statusValueSet.has(value);
}
