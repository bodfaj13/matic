export enum TicketPriority {
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export const TICKET_PRIORITY_ORDER = [
  TicketPriority.High,
  TicketPriority.Medium,
  TicketPriority.Low,
] as const;

export const ticketPriorityLabel: Record<TicketPriority, string> = {
  [TicketPriority.High]: 'High',
  [TicketPriority.Medium]: 'Medium',
  [TicketPriority.Low]: 'Low',
};

export function formatTicketPriority(priority: TicketPriority): string {
  return ticketPriorityLabel[priority];
}

const priorityValueSet = new Set<string>(Object.values(TicketPriority));

export function isTicketPriority(value: string): value is TicketPriority {
  return priorityValueSet.has(value);
}
