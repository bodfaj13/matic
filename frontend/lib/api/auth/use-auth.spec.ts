import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { createElement } from 'react';

import { loginRequest, registerRequest } from '@/lib/api/auth/index';
import { useLoginMutation, useRegisterMutation } from '@/lib/api/auth/use-auth';
import { useSessionStore } from '@/lib/stores/session-store';

jest.mock('@/lib/api/auth/index', () => ({
  loginRequest: jest.fn(),
  registerRequest: jest.fn(),
}));

const loginMock = loginRequest as jest.MockedFunction<typeof loginRequest>;
const registerMock = registerRequest as jest.MockedFunction<
  typeof registerRequest
>;

function makeWrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  };
}

function freshClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

describe('useLoginMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useSessionStore.setState({ accessToken: null, user: null });
    });
  });

  it('stores the access token + user in the session store on success', async () => {
    loginMock.mockResolvedValueOnce({
      data: { access_token: 'jwt', user: { email: 'a@b.co', role: 'agent' } },
    } as never);
    const client = freshClient();
    const invalidateSpy = jest.spyOn(client, 'invalidateQueries');

    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ email: 'a@b.co', password: 'p' });
    });

    const state = useSessionStore.getState();
    expect(state.accessToken).toBe('jwt');
    expect(state.user).toEqual({ email: 'a@b.co', role: 'agent' });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['tickets'] });
  });

  it('does not store anything if response payload is malformed', async () => {
    loginMock.mockResolvedValueOnce({ data: undefined } as never);
    const client = freshClient();

    const { result } = renderHook(() => useLoginMutation(), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ email: 'a@b.co', password: 'p' });
    });

    expect(useSessionStore.getState().accessToken).toBeNull();
  });
});

describe('useRegisterMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useSessionStore.setState({ accessToken: null, user: null });
    });
  });

  it('registers, stores session, and forwards the registration secret', async () => {
    registerMock.mockResolvedValueOnce({
      data: { access_token: 'jwt', id: 'u1', email: 'a@b.co', role: 'admin' },
    } as never);
    const client = freshClient();

    const { result } = renderHook(() => useRegisterMutation('shh'), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ email: 'a@b.co', password: 'p' });
    });

    expect(registerMock).toHaveBeenCalledWith(
      { email: 'a@b.co', password: 'p' },
      'shh',
    );
    const state = useSessionStore.getState();
    expect(state.accessToken).toBe('jwt');
    expect(state.user).toEqual({ email: 'a@b.co', role: 'admin' });
  });

  it('ignores incomplete register response payloads', async () => {
    registerMock.mockResolvedValueOnce({
      data: { access_token: 'jwt' },
    } as never);
    const client = freshClient();

    const { result } = renderHook(() => useRegisterMutation('shh'), {
      wrapper: makeWrapper(client),
    });

    await act(async () => {
      await result.current.mutateAsync({ email: 'a@b.co', password: 'p' });
    });

    expect(useSessionStore.getState().accessToken).toBeNull();
  });
});
