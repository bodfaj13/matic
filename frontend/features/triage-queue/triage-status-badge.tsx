import type { TriageStatus } from '@/lib/api/tickets/types';
import { cn } from '@/lib/utils';

const styles: Record<TriageStatus, string> = {
  pending: 'bg-muted text-muted-foreground',
  completed: 'bg-emerald-700/10 text-emerald-800 dark:text-emerald-400',
  failed: 'bg-destructive/10 text-destructive',
};

export function TriageStatusBadge({ status }: { status: TriageStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2 py-0.5 text-[0.6875rem] font-medium capitalize',
        styles[status],
      )}
    >
      {status}
    </span>
  );
}
