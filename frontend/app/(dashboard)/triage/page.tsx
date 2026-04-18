'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { LayoutGrid, Search, Table2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TicketDetailDrawer } from '@/features/triage-queue/ticket-detail-drawer';
import { TicketsKanban } from '@/features/triage-queue/tickets-kanban';
import { TicketsTableSkeleton } from '@/features/triage-queue/tickets-table-skeleton';
import { TicketsTable } from '@/features/triage-queue/tickets-table';
import { formFieldInputPrimaryClass } from '@/lib/form-field-styles';
import type { ListTicketsParams } from '@/lib/api/tickets/types';
import {
  formatTicketPriority,
  formatTicketStatus,
  isTicketPriority,
  isTicketStatus,
  type Ticket,
  TICKET_PRIORITY_ORDER,
  TICKET_STATUS_ORDER,
  type TicketPriority,
  type TicketStatus,
} from '@/lib/api/tickets/types';
import {
  useTicketsQuery,
  useUpdateTicketMutation,
} from '@/lib/api/tickets/use-tickets';
import { useSessionStore } from '@/lib/stores/session-store';
import { useDebouncedValue } from '@/lib/use-debounced-value';
import { cn } from '@/lib/utils';

const SEARCH_DEBOUNCE_MS = 350;

const statuses: (TicketStatus | '')[] = ['', ...TICKET_STATUS_ORDER];
const priorities: (TicketPriority | '')[] = ['', ...TICKET_PRIORITY_ORDER];

// Base UI's Select rejects empty-string values, so use a sentinel that maps
// to `undefined` (filter cleared) on the way out and back to "all" on the way in.
const ALL = 'all';
const filterPillTrigger =
  'h-auto w-full gap-2 rounded-xl border border-stone-200/90 bg-white px-3 py-1.5 text-[13px] font-semibold text-stone-900 shadow-none focus-visible:ring-0 focus-visible:border-stone-300 sm:w-auto';

function parsePage(raw: string | null): number {
  const n = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function parseLimit(raw: string | null, fallback: number): number {
  const n = raw ? Number.parseInt(raw, 10) : fallback;
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(n, 100);
}

function TriageQueueView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchRef = useRef<HTMLInputElement>(null);
  const accessToken = useSessionStore((s) => s.accessToken);
  const viewMode = useSessionStore((s) => s.viewMode);
  const setViewMode = useSessionStore((s) => s.setViewMode);
  const pageSizeDefault = useSessionStore((s) => s.pageSize);
  const setPageSizeStore = useSessionStore((s) => s.setPageSize);
  const [searchInput, setSearchInput] = useState(
    () => searchParams.get('search') ?? '',
  );
  const debouncedSearch = useDebouncedValue(searchInput, SEARCH_DEBOUNCE_MS);

  const listParams: ListTicketsParams = useMemo(() => {
    const page = parsePage(searchParams.get('page'));
    const limit = parseLimit(searchParams.get('limit'), pageSizeDefault);
    const statusRaw = searchParams.get('status') as TicketStatus | null;
    const priorityRaw = searchParams.get('priority') as TicketPriority | null;
    const status =
      statusRaw && isTicketStatus(statusRaw) ? statusRaw : undefined;
    const priority =
      priorityRaw && isTicketPriority(priorityRaw) ? priorityRaw : undefined;
    const search = debouncedSearch.trim() || undefined;
    return { page, limit, status, priority, search };
  }, [searchParams, pageSizeDefault, debouncedSearch]);

  const { data, isLoading, isFetching, error } = useTicketsQuery(listParams, {
    enabled: !!accessToken,
  });

  const updateTicket = useUpdateTicketMutation();
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const setSearch = useCallback(
    (updates: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === undefined || v === '') {
          next.delete(k);
        } else {
          next.set(k, v);
        }
      }
      router.push(`${pathname}?${next.toString()}`);
    },
    [pathname, router, searchParams],
  );

  const prevDebouncedRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (prevDebouncedRef.current === undefined) {
      prevDebouncedRef.current = trimmed;
      return;
    }
    if (prevDebouncedRef.current === trimmed) return;
    prevDebouncedRef.current = trimmed;
    const page = parsePage(searchParams.get('page'));
    if (page > 1) {
      setSearch({ page: '1' });
    }
  }, [debouncedSearch, searchParams, setSearch]);

  const tickets = useMemo(() => data?.tickets ?? [], [data?.tickets]);
  const tableSkeletonRows = Math.min(
    Math.max(listParams.limit ?? pageSizeDefault, 1),
    30,
  );
  const totalPages = data?.totalPages ?? 1;
  const currentPage = listParams.page ?? 1;
  const pageSize = data?.pageSize ?? listParams.limit ?? pageSizeDefault;
  const totalCount = data?.totalCount ?? 0;
  const pageNumber = data?.pageNumber ?? currentPage;

  const rangeStart = totalCount === 0 ? 0 : (pageNumber - 1) * pageSize + 1;
  const rangeEnd =
    totalCount === 0 ? 0 : Math.min(pageNumber * pageSize, totalCount);

  const openDrawer = (t: Ticket) => {
    setSelected(t);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    setSelected((prev) =>
      prev && prev._id === id ? { ...prev, status } : prev,
    );
    await updateTicket.mutateAsync({ id, body: { status } });
  };

  return (
    <div className="min-h-dvh bg-[#F9F8F7] px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="mx-auto max-w-[1200px]">
        <header className="flex flex-col gap-5 border-b border-stone-200/80 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-stone-900 sm:text-[1.75rem]">
              Tickets
            </h1>
            <span className="rounded-full bg-stone-200/90 px-2.5 py-0.5 text-[13px] font-semibold tabular-nums text-stone-700">
              {totalCount}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[200px] max-w-md flex-1 sm:min-w-[260px]">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400"
                aria-hidden
              />
              <Input
                ref={searchRef}
                type="search"
                placeholder="Search tickets…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={cn(
                  formFieldInputPrimaryClass,
                  'h-10 pl-9 pr-16 text-[13px]',
                )}
                aria-label="Search tickets"
              />
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-stone-200/80 bg-stone-50 px-1.5 py-0.5 text-[10px] font-medium text-stone-500 sm:inline">
                ⌘K
              </kbd>
            </div>
            <div className="flex rounded-xl border border-stone-200/90 bg-white p-1 shadow-none">
              <Button
                type="button"
                size="icon-sm"
                variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                className={cn(
                  viewMode === 'table' && 'bg-[#F3F2F1] shadow-none',
                )}
                onClick={() => setViewMode('table')}
                aria-label="Table view"
              >
                <Table2 className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon-sm"
                variant={viewMode === 'kanban' ? 'secondary' : 'ghost'}
                className={cn(
                  viewMode === 'kanban' && 'bg-[#F3F2F1] shadow-none',
                )}
                onClick={() => setViewMode('kanban')}
                aria-label="Board view"
              >
                <LayoutGrid className="size-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="basis-[calc(50%-0.25rem)] sm:basis-auto">
            <Select
              value={listParams.status ?? ALL}
              onValueChange={(v) => {
                if (!v) return;
                setSearch({
                  status: v === ALL ? undefined : (v as TicketStatus),
                  page: '1',
                });
              }}
            >
              <SelectTrigger
                aria-label="Status filter"
                className={filterPillTrigger}
              >
                <span className="font-medium text-stone-500">Status:</span>
                <SelectValue>
                  {(v) =>
                    v == null || v === ALL
                      ? 'All'
                      : isTicketStatus(v as string)
                        ? formatTicketStatus(v as TicketStatus)
                        : String(v)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s || ALL} value={s || ALL}>
                    {s === '' ? 'All' : formatTicketStatus(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="basis-[calc(50%-0.25rem)] sm:basis-auto">
            <Select
              value={listParams.priority ?? ALL}
              onValueChange={(v) => {
                if (!v) return;
                setSearch({
                  priority: v === ALL ? undefined : (v as TicketPriority),
                  page: '1',
                });
              }}
            >
              <SelectTrigger
                aria-label="Priority filter"
                className={filterPillTrigger}
              >
                <span className="font-medium text-stone-500">Priority:</span>
                <SelectValue>
                  {(v) =>
                    v == null || v === ALL
                      ? 'All'
                      : isTicketPriority(v as string)
                        ? formatTicketPriority(v as TicketPriority)
                        : String(v)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {priorities.map((p) => (
                  <SelectItem key={p || ALL} value={p || ALL}>
                    {p === '' ? 'All' : formatTicketPriority(p)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="basis-full sm:basis-auto">
            <Select
              value={String(listParams.limit ?? pageSizeDefault)}
              onValueChange={(v) => {
                if (!v) return;
                const n = Number.parseInt(v, 10);
                setPageSizeStore(n);
                setSearch({ limit: String(n), page: '1' });
              }}
            >
              <SelectTrigger
                aria-label="Page size"
                className={filterPillTrigger}
              >
                <span className="font-medium text-stone-500">Page size:</span>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {isFetching ? (
            <span className="basis-full text-xs text-stone-500 sm:basis-auto">
              Updating…
            </span>
          ) : null}
        </div>

        <div className="mt-8">
          {error ? (
            <p className="text-sm text-destructive">Failed to load tickets.</p>
          ) : isLoading && viewMode === 'table' ? (
            <TicketsTableSkeleton rows={tableSkeletonRows} />
          ) : isLoading ? (
            <p className="text-sm text-stone-500">Loading tickets…</p>
          ) : tickets.length === 0 ? (
            <div className="rounded-2xl border border-stone-200/80 bg-white px-6 py-16 text-center">
              <p className="font-heading text-xl font-semibold text-stone-900">
                Nothing in this view
              </p>
              <p className="mt-2 text-sm text-stone-500">
                {debouncedSearch.trim()
                  ? 'Try a different search or clear filters.'
                  : 'Adjust filters or wait for new submissions.'}
              </p>
            </div>
          ) : viewMode === 'table' ? (
            <TicketsTable
              tickets={tickets}
              selectedId={selected?._id ?? null}
              onSelect={openDrawer}
            />
          ) : (
            <TicketsKanban
              tickets={tickets}
              selectedId={selected?._id ?? null}
              onSelect={openDrawer}
              onMove={(ticket, status) =>
                void handleStatusChange(ticket._id, status)
              }
            />
          )}
        </div>

        {tickets.length > 0 && viewMode === 'table' ? (
          <div className="mt-6 flex flex-col gap-3 border-t border-stone-200/80 pt-5 text-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[13px] text-stone-500">
              Showing{' '}
              <span className="font-medium text-stone-800">
                {rangeStart}-{rangeEnd}
              </span>{' '}
              of{' '}
              <span className="font-medium text-stone-800">{totalCount}</span>{' '}
              tickets
            </p>
            <div className="flex gap-6">
              <button
                type="button"
                className="cursor-pointer text-[13px] font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={currentPage <= 1}
                onClick={() =>
                  setSearch({ page: String(Math.max(1, currentPage - 1)) })
                }
              >
                Prev
              </button>
              <button
                type="button"
                className="cursor-pointer text-[13px] font-semibold text-primary disabled:cursor-not-allowed disabled:opacity-40"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setSearch({
                    page: String(Math.min(totalPages, currentPage + 1)),
                  })
                }
              >
                Next
              </button>
            </div>
          </div>
        ) : null}

        <TicketDetailDrawer
          ticket={selected}
          open={drawerOpen}
          onClose={closeDrawer}
          onStatusChange={(id, status) => void handleStatusChange(id, status)}
          isUpdating={updateTicket.isPending}
        />
      </div>
    </div>
  );
}

function TriageQueueInner() {
  const searchParams = useSearchParams();
  const urlSearchKey = searchParams.get('search') ?? '';
  return <TriageQueueView key={urlSearchKey} />;
}

export default function TriagePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center bg-[#F9F8F7] p-6 text-sm text-stone-500">
          Loading queue…
        </div>
      }
    >
      <TriageQueueInner />
    </Suspense>
  );
}
