'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import { loginRequest, registerRequest } from '@/lib/api/auth/index';
import type { BaseResponse } from '@/lib/api/types';
import type {
  LoginRequestBody,
  RegisterRequestBody,
} from '@/lib/api/auth/types';
import { useSessionStore } from '@/lib/stores/session-store';

export function useLoginMutation() {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (body: LoginRequestBody) => loginRequest(body),
    onSuccess: (res) => {
      const payload = res.data;
      if (payload?.access_token && payload.user) {
        setSession(payload.access_token, payload.user);
      }
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export function useRegisterMutation(registrationSecret: string) {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((s) => s.setSession);

  return useMutation({
    mutationFn: (body: RegisterRequestBody) =>
      registerRequest(body, registrationSecret),
    onSuccess: (res) => {
      const payload = res.data;
      if (payload?.access_token && payload.email && payload.role) {
        setSession(payload.access_token, {
          email: payload.email,
          role: payload.role,
        });
      }
      void queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
  });
}

export type AuthMutationError = AxiosError<BaseResponse>;
