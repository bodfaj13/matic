'use client';

import { PanelRight } from 'lucide-react';

import type { Ticket } from '@/lib/api/tickets/types';
import { formatRelativeTime } from '@/app/utils/format-relative-time';
import { Button } from '@/components/ui/button';
import { PriorityInline } from '@/features/triage-queue/priority-inline';
import { StatusPill } from '@/features/triage-queue/status-pill';
import { TriageStatusBadge } from '@/features/triage-queue/triage-status-badge';
import { ticketDisplayRefHash } from '@/lib/ticket-ref';
import { cn } from '@/lib/utils';

type TicketsTableProps = {
  tickets: Ticket[];
  selectedId: string | null;
  onSelect: (ticket: Ticket) => void;
};

export function TicketsTable({
  tickets,
  selectedId,
  onSelect,
}: TicketsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-[0_1px_0_rgba(15,15,25,0.04)]">
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
          <tbody>
            {tickets.map((t, i) => (
              <tr
                key={t._id}
                className={cn(
                  'cursor-pointer border-b border-stone-100 transition-colors last:border-b-0',
                  i % 2 === 1 && 'bg-[#FAFAF9]/80',
                  selectedId === t._id
                    ? 'bg-primary/[0.08] shadow-[inset_3px_0_0_0_var(--color-primary)]'
                    : 'hover:bg-stone-50',
                )}
                onClick={() => onSelect(t)}
              >
                <td className="px-3 py-3.5" aria-hidden>
                  <span className="inline-block size-3.5 rounded border border-stone-300 bg-white" />
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 font-mono text-[12px] font-semibold text-stone-700">
                  {ticketDisplayRefHash(t._id)}
                </td>
                <td className="max-w-[280px] truncate px-3 py-3.5 font-medium text-stone-900">
                  {t.title}
                </td>
                <td className="truncate px-3 py-3.5 text-[13px] text-stone-500">
                  {t.customer_email}
                </td>
                <td className="px-3 py-3.5">
                  <span className="inline-flex rounded-md bg-stone-200/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-stone-600">
                    {t.category}
                  </span>
                </td>
                <td className="px-3 py-3.5">
                  <PriorityInline priority={t.priority} />
                </td>
                <td className="px-3 py-3.5">
                  <StatusPill status={t.status} />
                </td>
                <td className="px-3 py-3.5">
                  <TriageStatusBadge status={t.triageStatus} />
                </td>
                <td className="whitespace-nowrap px-3 py-3.5 text-[13px] text-stone-500">
                  {formatRelativeTime(t.createdAt)}
                </td>
                <td
                  className="px-2 py-1.5 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-stone-600 hover:text-stone-900"
                    aria-label={`View ticket ${ticketDisplayRefHash(t._id)}`}
                    onClick={() => onSelect(t)}
                  >
                    <PanelRight className="size-3.5 shrink-0" aria-hidden />
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
