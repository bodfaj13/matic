import { act } from '@testing-library/react';

import type { LoginUser } from '@/lib/api/auth/types';
import { useSessionStore } from './session-store';

describe('useSessionStore', () => {
  beforeEach(() => {
    act(() => {
      useSessionStore.setState({
        accessToken: null,
        user: null,
        viewMode: 'table',
        sidebarCollapsed: false,
        pageSize: 20,
      });
    });
  });

  it('setSession stores the access token and user', () => {
    const user: LoginUser = { email: 'a@b.co', role: 'agent' };
    act(() => {
      useSessionStore.getState().setSession('jwt-token', user);
    });
    const state = useSessionStore.getState();
    expect(state.accessToken).toBe('jwt-token');
    expect(state.user).toEqual(user);
  });

  it('clearSession wipes token and user but preserves UI prefs', () => {
    act(() => {
      useSessionStore.getState().setSession('jwt-token', {
        email: 'a@b.co',
        role: 'admin',
      });
      useSessionStore.getState().setViewMode('kanban');
      useSessionStore.getState().setSidebarCollapsed(true);
      useSessionStore.getState().setPageSize(50);
    });

    act(() => {
      useSessionStore.getState().clearSession();
    });

    const state = useSessionStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
    expect(state.viewMode).toBe('kanban');
    expect(state.sidebarCollapsed).toBe(true);
    expect(state.pageSize).toBe(50);
  });

  it.each([['table' as const], ['kanban' as const]])(
    'setViewMode switches to %s',
    (mode) => {
      act(() => {
        useSessionStore.getState().setViewMode(mode);
      });
      expect(useSessionStore.getState().viewMode).toBe(mode);
    },
  );

  it('setSidebarCollapsed updates only its slice', () => {
    act(() => {
      useSessionStore.getState().setSidebarCollapsed(true);
    });
    expect(useSessionStore.getState().sidebarCollapsed).toBe(true);
    act(() => {
      useSessionStore.getState().setSidebarCollapsed(false);
    });
    expect(useSessionStore.getState().sidebarCollapsed).toBe(false);
  });

  it('setPageSize updates only its slice', () => {
    act(() => {
      useSessionStore.getState().setPageSize(100);
    });
    expect(useSessionStore.getState().pageSize).toBe(100);
  });
});
