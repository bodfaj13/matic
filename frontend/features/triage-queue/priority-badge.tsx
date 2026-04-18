import { formatTicketPriority, TicketPriority } from '@/lib/api/tickets/types';
import { cn } from '@/lib/utils';

const styles: Record<TicketPriority, string> = {
  [TicketPriority.High]: 'bg-amber-500/10 text-amber-700 dark:text-amber-500',
  [TicketPriority.Medium]: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
  [TicketPriority.Low]:
    'bg-emerald-700/10 text-emerald-800 dark:text-emerald-400',
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-[0.6875rem] font-medium tracking-wide',
        styles[priority],
      )}
    >
      {formatTicketPriority(priority)}
    </span>
  );
}
