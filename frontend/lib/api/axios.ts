import axios, { type AxiosError } from 'axios';

import type { BaseResponse } from '@/lib/api/types';

function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';
  return raw.replace(/\/$/, '');
}

export const apiClient = axios.create({
  baseURL: `${getBaseUrl()}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  validateStatus: (s) => s >= 200 && s < 300,
});

type TokenGetter = () => string | null;
type UnauthorizedHandler = () => void;

// Wired up at app start by the session store so this module stays free of
// React/Zustand imports (would otherwise create a cycle through hooks).
let getAccessToken: TokenGetter = () => null;
let onUnauthorized: UnauthorizedHandler | null = null;

export function setApiAccessTokenGetter(fn: TokenGetter): void {
  getAccessToken = fn;
}

export function setApiUnauthorizedHandler(
  fn: UnauthorizedHandler | null,
): void {
  onUnauthorized = fn;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<BaseResponse>) => {
    if (error.response?.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);
