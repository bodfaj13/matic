'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

import {
  setApiAccessTokenGetter,
  setApiUnauthorizedHandler,
} from '@/lib/api/axios';
import { useSessionStore } from '@/lib/stores/session-store';

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: 1,
      },
    },
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(makeQueryClient);

  useEffect(() => {
    setApiAccessTokenGetter(() => useSessionStore.getState().accessToken);
    setApiUnauthorizedHandler(() => {
      useSessionStore.getState().clearSession();
      queryClient.clear();
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register')) {
        window.location.assign('/login');
      }
    });
    return () => {
      setApiAccessTokenGetter(() => null);
      setApiUnauthorizedHandler(null);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
