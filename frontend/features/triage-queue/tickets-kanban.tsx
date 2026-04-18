'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState, type CSSProperties, type KeyboardEvent } from 'react';

import {
  formatTicketStatus,
  isTicketStatus,
  type Ticket,
  TICKET_STATUS_ORDER,
  type TicketStatus,
} from '@/lib/api/tickets/types';
import { PriorityBadge } from '@/features/triage-queue/priority-badge';
import { TriageStatusBadge } from '@/features/triage-queue/triage-status-badge';
import { cn } from '@/lib/utils';

const columns = TICKET_STATUS_ORDER.map((status) => ({
  status,
  label: formatTicketStatus(status),
}));

type TicketsKanbanProps = {
  tickets: Ticket[];
  selectedId: string | null;
  onSelect: (ticket: Ticket) => void;
  onMove: (ticket: Ticket, status: TicketStatus) => void;
};

export function TicketsKanban({
  tickets,
  selectedId,
  onSelect,
  onMove,
}: TicketsKanbanProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = event.active.data.current?.ticket as Ticket | undefined;
    setActiveTicket(ticket ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;
    const ticket = active.data.current?.ticket as Ticket | undefined;
    if (!ticket) return;
    const targetStatus = String(over.id);
    if (!isTicketStatus(targetStatus)) return;
    if (targetStatus === ticket.status) return;
    onMove(ticket, targetStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveTicket(null)}
    >
      <div className="grid gap-4 md:grid-cols-3">
        {columns.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            label={col.label}
            tickets={tickets.filter((t) => t.status === col.status)}
            selectedId={selectedId}
            onSelect={onSelect}
            isDraggingActive={activeTicket !== null}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeTicket ? <TicketCardPreview ticket={activeTicket} /> : null}
      </DragOverlay>
    </DndContext>
  );
}

type KanbanColumnProps = {
  status: TicketStatus;
  label: string;
  tickets: Ticket[];
  selectedId: string | null;
  onSelect: (ticket: Ticket) => void;
  isDraggingActive: boolean;
};

function KanbanColumn({
  status,
  label,
  tickets,
  selectedId,
  onSelect,
  isDraggingActive,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      aria-label={`${label} column`}
      className={cn(
        'flex min-h-[280px] flex-col rounded-xl bg-secondary p-3 transition-colors',
        isDraggingActive && 'ring-1 ring-primary/10',
        isOver && 'bg-primary/5 ring-2 ring-primary/40',
      )}
    >
      <div className="mb-3 flex items-center justify-between px-1">
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        <span className="text-xs text-muted-foreground">{tickets.length}</span>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        {tickets.map((t) => (
          <KanbanCard
            key={t._id}
            ticket={t}
            isSelected={selectedId === t._id}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

type KanbanCardProps = {
  ticket: Ticket;
  isSelected: boolean;
  onSelect: (ticket: Ticket) => void;
};

function KanbanCard({ ticket, isSelected, onSelect }: KanbanCardProps) {
  const { setNodeRef, attributes, listeners, transform, isDragging } =
    useDraggable({ id: ticket._id, data: { ticket } });

  const style: CSSProperties = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : {};

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSelect(ticket);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      role="button"
      tabIndex={0}
      aria-roledescription="draggable ticket"
      aria-label={`Ticket: ${ticket.title}`}
      onClick={() => onSelect(ticket)}
      onKeyDown={handleKeyDown}
      className={cn(
        'cursor-grab rounded-lg bg-card p-3 text-left shadow-sm transition-shadow outline-none hover:shadow-md active:cursor-grabbing focus-visible:ring-2 focus-visible:ring-primary/40',
        isSelected &&
          'ring-2 ring-primary/30 ring-offset-2 ring-offset-secondary',
        isDragging && 'opacity-40',
      )}
    >
      <p className="line-clamp-2 text-sm font-medium">{ticket.title}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <PriorityBadge priority={ticket.priority} />
        <TriageStatusBadge status={ticket.triageStatus} />
      </div>
    </div>
  );
}

function TicketCardPreview({ ticket }: { ticket: Ticket }) {
  return (
    <div className="rounded-lg bg-card p-3 text-left shadow-lg ring-2 ring-primary/40">
      <p className="line-clamp-2 text-sm font-medium">{ticket.title}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <PriorityBadge priority={ticket.priority} />
        <TriageStatusBadge status={ticket.triageStatus} />
      </div>
    </div>
  );
}
