'use client';

import { startTransition, useEffect, useState } from 'react';

import { useSessionStore } from '@/lib/stores/session-store';

/**
 * Avoid auth layout flash: Zustand persist reads localStorage after mount.
 */
export function useSessionHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const mark = () => {
      startTransition(() => setHydrated(true));
    };
    const persist = useSessionStore.persist;
    if (!persist) {
      mark();
      return;
    }
    if (persist.hasHydrated()) {
      mark();
      return () => {};
    }
    const unsub = persist.onFinishHydration(() => {
      mark();
    });
    return unsub;
  }, []);

  return hydrated;
}

export function SessionHydrationGate({
  children,
  fallback = null,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const hydrated = useSessionHydrated();
  if (!hydrated) return fallback;
  return children;
}
