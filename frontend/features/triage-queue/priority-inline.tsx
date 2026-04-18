import { formatTicketPriority, TicketPriority } from '@/lib/api/tickets/types';
import { cn } from '@/lib/utils';

const dot: Record<TicketPriority, string> = {
  [TicketPriority.High]: 'bg-amber-500',
  [TicketPriority.Medium]: 'bg-slate-400',
  [TicketPriority.Low]: 'bg-emerald-500',
};

export function PriorityInline({ priority }: { priority: TicketPriority }) {
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-medium text-stone-800">
      <span
        className={cn('size-2 shrink-0 rounded-full', dot[priority])}
        aria-hidden
      />
      {formatTicketPriority(priority)}
    </span>
  );
}
