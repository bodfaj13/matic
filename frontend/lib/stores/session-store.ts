'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { LoginUser } from '@/lib/api/auth/types';

export type TriageViewMode = 'table' | 'kanban';

type SessionState = {
  accessToken: string | null;
  user: LoginUser | null;
  viewMode: TriageViewMode;
  sidebarCollapsed: boolean;
  pageSize: number;
  setSession: (accessToken: string, user: LoginUser) => void;
  clearSession: () => void;
  setViewMode: (mode: TriageViewMode) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setPageSize: (n: number) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      viewMode: 'table',
      sidebarCollapsed: false,
      pageSize: 20,
      setSession: (accessToken, user) => set({ accessToken, user }),
      clearSession: () => set({ accessToken: null, user: null }),
      setViewMode: (viewMode) => set({ viewMode }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setPageSize: (pageSize) => set({ pageSize }),
    }),
    {
      name: 'smart-triage',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        accessToken: s.accessToken,
        user: s.user,
        viewMode: s.viewMode,
        sidebarCollapsed: s.sidebarCollapsed,
        pageSize: s.pageSize,
      }),
    },
  ),
);
