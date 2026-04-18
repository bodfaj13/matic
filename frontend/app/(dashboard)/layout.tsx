'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogOut, PanelLeft, PanelLeftClose, Ticket } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { SessionHydrationGate } from '@/components/session-hydration-gate';
import { SmartTriageLogoMark } from '@/components/smart-triage-public-header';
import { Button, buttonVariants } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/lib/stores/session-store';
import { cn } from '@/lib/utils';

// Tailwind `md` breakpoint: viewports below this auto-collapse the sidebar
// (without persisting the choice — desktop preference is preserved).
function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return isMobile;
}

function emailInitials(email: string): string {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2)
    return `${parts[0]![0]!}${parts[1]![0]!}`.toUpperCase();
  return local.slice(0, 2).toUpperCase() || '??';
}

function displayNameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length === 0) return email;
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

function DashboardChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const accessToken = useSessionStore((s) => s.accessToken);
  const user = useSessionStore((s) => s.user);
  const persistedCollapsed = useSessionStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useSessionStore((s) => s.setSidebarCollapsed);
  const clearSession = useSessionStore((s) => s.clearSession);
  const isMobile = useIsMobileViewport();
  // Force-collapsed on mobile; toggle still works on desktop.
  const sidebarCollapsed = persistedCollapsed || isMobile;

  const isTriage = pathname === '/triage';

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken, router]);

  const logout = () => {
    clearSession();
    void queryClient.clear();
    router.replace('/login');
  };

  if (!accessToken) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F9F8F7] text-sm text-muted-foreground">
        Redirecting…
      </div>
    );
  }

  const navBtn = (active: boolean, collapsed: boolean) =>
    cn(
      buttonVariants({ variant: 'ghost', size: 'sm' }),
      'h-9 justify-start gap-3 rounded-lg px-2.5 text-[13px] font-medium text-stone-700 transition-colors hover:bg-white/70 hover:text-stone-900',
      !collapsed &&
        active &&
        'border-l-[3px] border-primary bg-primary/10 pl-[7px] text-stone-900 hover:bg-primary/[0.12]',
      !collapsed && !active && 'border-l-[3px] border-transparent pl-[10px]',
      collapsed && 'justify-center border-l-0 px-0 pl-0',
      collapsed && active && 'bg-primary/10',
    );

  return (
    <div className="flex min-h-dvh bg-[#F9F8F7] text-foreground">
      <aside
        className={cn(
          'relative z-10 flex flex-col overflow-x-visible border-r border-stone-200/90 bg-[#F3F2F1] py-6 transition-[width] duration-200',
          sidebarCollapsed ? 'w-[72px] px-2' : 'w-[248px] px-4',
        )}
      >
        <div
          className={cn(
            'flex items-start justify-between gap-2 px-1',
            sidebarCollapsed && 'flex-col items-center',
          )}
        >
          <Link
            href="/triage"
            className="flex min-w-0 items-center gap-2.5 no-underline"
          >
            <SmartTriageLogoMark />
            {!sidebarCollapsed ? (
              <span className="min-w-0">
                <span className="block font-heading text-[15px] font-semibold leading-tight tracking-tight text-stone-900">
                  Smart Triage
                </span>
                <span className="mt-0.5 block text-[11px] font-medium leading-tight text-stone-500">
                  Support Intelligence
                </span>
              </span>
            ) : (
              <span className="sr-only">Smart Triage</span>
            )}
          </Link>
          {!isMobile ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-stone-600 hover:bg-white/80 hover:text-stone-900"
              onClick={() => setSidebarCollapsed(!persistedCollapsed)}
              aria-label={
                persistedCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
              }
            >
              {persistedCollapsed ? (
                <PanelLeft className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
            </Button>
          ) : null}
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-0.5 overflow-x-visible px-1">
          <Link
            href="/triage"
            className={cn(
              navBtn(isTriage, sidebarCollapsed),
              sidebarCollapsed && 'group relative overflow-visible',
            )}
            aria-label={sidebarCollapsed ? 'Tickets' : undefined}
            title={sidebarCollapsed ? 'Tickets' : undefined}
          >
            <Ticket className="size-4 shrink-0 text-stone-600" aria-hidden />
            {!sidebarCollapsed ? 'Tickets' : null}
            {sidebarCollapsed ? (
              <span
                className="absolute left-[calc(100%+8px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-stone-200/90 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-800 opacity-0 shadow-md transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100"
                aria-hidden
              >
                Tickets
              </span>
            ) : null}
          </Link>
        </nav>

        <div
          className={cn(
            'mt-auto overflow-x-visible border-t border-stone-200/80 pt-4',
            sidebarCollapsed ? 'px-0' : 'px-1',
          )}
        >
          {user ? (
            <div
              className={cn(
                'flex items-center gap-3 rounded-xl px-2 py-2',
                sidebarCollapsed && 'flex-col justify-center px-0',
              )}
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[12px] font-bold text-primary">
                {emailInitials(user.email)}
              </span>
              {!sidebarCollapsed ? (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-stone-900">
                    {displayNameFromEmail(user.email)}
                  </p>
                  <p className="truncate text-[11px] font-medium capitalize text-stone-500">
                    {user.role}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={cn(
              'mt-2 w-full justify-start gap-2 text-stone-600 hover:bg-white/70 hover:text-stone-900',
              sidebarCollapsed &&
                'group relative justify-center overflow-visible px-0',
            )}
            onClick={logout}
            aria-label={sidebarCollapsed ? 'Sign out' : undefined}
            title={sidebarCollapsed ? 'Sign out' : undefined}
          >
            <LogOut className="size-4 shrink-0" aria-hidden />
            {!sidebarCollapsed ? 'Sign out' : null}
            {sidebarCollapsed ? (
              <span
                className="absolute left-[calc(100%+8px)] top-1/2 z-50 -translate-y-1/2 whitespace-nowrap rounded-lg border border-stone-200/90 bg-white px-2.5 py-1 text-[11px] font-semibold text-stone-800 opacity-0 shadow-md transition-opacity duration-100 group-hover:opacity-100 group-focus-visible:opacity-100"
                aria-hidden
              >
                Sign out
              </span>
            ) : null}
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionHydrationGate
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-[#F9F8F7] text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      <DashboardChrome>{children}</DashboardChrome>
    </SessionHydrationGate>
  );
}
