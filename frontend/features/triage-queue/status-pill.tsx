import { formatTicketStatus, type TicketStatus } from '@/lib/api/tickets/types';

export function StatusPill({ status }: { status: TicketStatus }) {
  return (
    <span className="inline-flex rounded-full border border-stone-200/90 bg-white px-2.5 py-0.5 text-[11px] font-semibold tracking-tight text-stone-800">
      {formatTicketStatus(status)}
    </span>
  );
}
