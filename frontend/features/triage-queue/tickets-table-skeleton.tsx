'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type TicketsTableSkeletonProps = {
  rows?: number;
};

export function TicketsTableSkeleton({ rows = 10 }: TicketsTableSkeletonProps) {
  const count = Math.min(Math.max(rows, 1), 30);

  return (
    <div
      className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_0_rgba(15,15,25,0.04)]"
      aria-busy="true"
      aria-label="Loading tickets"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-stone-200/80 bg-[#FAFAF9] text-[0.65rem] font-bold uppercase tracking-[0.08em] text-stone-500">
              <th className="w-10 px-3 py-3.5" aria-hidden>
                <span className="sr-only">Row</span>
              </th>
              <th className="whitespace-nowrap px-3 py-3.5 font-bold">ID</th>
              <th className="min-w-[200px] px-3 py-3.5 font-bold">Subject</th>
              <th className="min-w-[180px] px-3 py-3.5 font-bold">Requester</th>
              <th className="px-3 py-3.5 font-bold">Category</th>
              <th className="px-3 py-3.5 font-bold">Priority</th>
              <th className="px-3 py-3.5 font-bold">Status</th>
              <th className="px-3 py-3.5 font-bold">Triage</th>
              <th className="whitespace-nowrap px-3 py-3.5 font-bold">
                Created
              </th>
              <th className="w-px whitespace-nowrap px-3 py-3.5 text-right font-bold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="[&_td]:align-middle">
            {Array.from({ length: count }, (_, i) => (
              <tr
                key={i}
                className={cn(
                  'border-b border-stone-100 last:border-b-0',
                  i % 2 === 1 && 'bg-[#FAFAF9]/80',
                )}
              >
                <td className="px-3 py-3.5" aria-hidden>
                  <Skeleton className="size-3.5 rounded bg-stone-200/90" />
                </td>
                <td className="px-3 py-3.5">
                  <Skeleton className="h-4 w-14 bg-stone-200/90" />
                </td>
                <td className="max-w-[280px] px-3 py-3.5">
                  <Skeleton className="h-4 w-full max-w-[220px] bg-stone-200/90" />
                </td>
                <td className="px-3 py-3.5">
                  <Skeleton className="h-4 w-full max-w-[160px] bg-stone-200/90" />
                </td>
                <td className="px-3 py-3.5">
                  <Skeleton className="h-6 w-16 rounded-md bg-stone-200/90" />
                </td>
                <td className="px-3 py-3.5">
                  <Skeleton className="h-6 w-[72px] rounded-full bg-stone-200/90" />
                </td>
                <td className="px-3 py-3.5">
                  <Skeleton className="h-6 w-20 rounded-full bg-stone-200/90" />
                </td>
                <td className="px-3 py-3.5">
                  <Skeleton className="h-6 w-[76px] rounded-md bg-stone-200/90" />
                </td>
                <td className="px-3 py-3.5">
                  <Skeleton className="h-4 w-24 bg-stone-200/90" />
                </td>
                <td className="px-2 py-1.5 text-right">
                  <div className="inline-flex justify-end">
                    <Skeleton className="h-7 w-[4.25rem] rounded-lg bg-stone-200/90" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
