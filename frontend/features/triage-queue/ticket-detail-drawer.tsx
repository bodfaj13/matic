'use client';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  formatTicketStatus,
  type Ticket,
  TICKET_STATUS_ORDER,
  type TicketStatus,
} from '@/lib/api/tickets/types';
import { PriorityBadge } from '@/features/triage-queue/priority-badge';
import { TriageStatusBadge } from '@/features/triage-queue/triage-status-badge';
import { ticketDisplayRefHash } from '@/lib/ticket-ref';
import { cn } from '@/lib/utils';

/** Drawer is fed from list selection only; there is no `GET /tickets/:id` yet for shareable URLs. */
type TicketDetailDrawerProps = {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  onStatusChange: (id: string, status: TicketStatus) => void;
  isUpdating: boolean;
};

function categoryPill(category: string) {
  return (
    <span className="inline-flex rounded-md border border-stone-200/80 bg-white/90 px-1.5 py-0.5 text-[11px] font-semibold tracking-tight text-stone-900">
      {category}
    </span>
  );
}

function triageMetaRows(ticket: Ticket) {
  return (
    <dl className="mt-3 space-y-2">
      <div className="flex items-center justify-between gap-4">
        <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Category
        </dt>
        <dd className="min-w-0 text-right">{categoryPill(ticket.category)}</dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
          Priority
        </dt>
        <dd className="flex shrink-0 justify-end">
          <PriorityBadge priority={ticket.priority} />
        </dd>
      </div>
    </dl>
  );
}

export function TicketDetailDrawer({
  ticket,
  open,
  onClose,
  onStatusChange,
  isUpdating,
}: TicketDetailDrawerProps) {
  if (!open || !ticket) return null;

  const triageCompleted = ticket.triageStatus === 'completed';
  const triageFailed = ticket.triageStatus === 'failed';
  const triagePending = ticket.triageStatus === 'pending';

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 cursor-pointer bg-[rgba(10,10,10,0.04)] backdrop-blur-[2px]"
        aria-label="Close drawer"
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-card text-card-foreground shadow-[0_12px_40px_-10px_rgba(10,10,10,0.12)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ticket-drawer-title"
      >
        <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="min-w-0 pr-2">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Ticket
            </p>
            <h2
              id="ticket-drawer-title"
              className="mt-0.5 text-base font-semibold leading-snug tracking-tight"
            >
              {ticket.title}
            </h2>
            <p
              className="mt-1 font-mono text-[11px] font-semibold tabular-nums text-muted-foreground"
              title={ticket._id}
            >
              {ticketDisplayRefHash(ticket._id)}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </header>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <section className="space-y-1">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Requester
            </p>
            <p className="text-[13px] leading-snug">{ticket.customer_email}</p>
          </section>

          <section className="space-y-1">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Description
            </p>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
              {ticket.description}
            </p>
          </section>

          <section
            className={cn(
              'rounded-lg border bg-secondary/80 px-3 py-2.5',
              triageFailed ? 'border-destructive/25' : 'border-border/60',
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <p className="text-[13px] font-semibold text-foreground">
                  Smart Triage AI
                </p>
                {triageCompleted ? (
                  <span className="inline-flex shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    Smart triaged
                  </span>
                ) : null}
              </div>
              {!triageCompleted ? (
                <TriageStatusBadge status={ticket.triageStatus} />
              ) : null}
            </div>

            {triageFailed ? (
              <>
                <p className="mt-2 text-[12px] font-medium leading-snug text-destructive">
                  Triage failed.
                </p>
                {ticket.triageError ? (
                  <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">
                    {ticket.triageError}
                  </p>
                ) : null}
                {triageMetaRows(ticket)}
              </>
            ) : triagePending ? (
              <>
                <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
                  Triage in progress.
                </p>
                {triageMetaRows(ticket)}
              </>
            ) : (
              <>
                <p className="mt-2 text-[12px] leading-snug text-muted-foreground">
                  Inferred from the subject and description.
                </p>
                {triageMetaRows(ticket)}
              </>
            )}
          </section>

          <section className="space-y-2">
            <p className="text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Workflow status
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TICKET_STATUS_ORDER.map((s) => (
                <Button
                  key={s}
                  type="button"
                  size="sm"
                  variant={ticket.status === s ? 'default' : 'outline'}
                  className={
                    ticket.status === s
                      ? 'btn-primary-gradient rounded-[10px] text-primary-foreground'
                      : 'rounded-[10px]'
                  }
                  disabled={isUpdating || ticket.status === s}
                  onClick={() => onStatusChange(ticket._id, s)}
                >
                  {formatTicketStatus(s)}
                </Button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
