/** Short display ref from Mongo id (matches triage table), e.g. `TRG-4078`. */
export function ticketDisplayRef(ticketId: string): string {
  return `TRG-${ticketId.slice(-4).toUpperCase()}`;
}

/** Same ref with leading `#`, e.g. `#TRG-4078`. */
export function ticketDisplayRefHash(ticketId: string): string {
  return `#${ticketDisplayRef(ticketId)}`;
}
