import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { AxiosHeaders } from 'axios';

import {
  apiClient,
  setApiAccessTokenGetter,
  setApiUnauthorizedHandler,
} from './axios';

type RequestInterceptor = (
  config: InternalAxiosRequestConfig,
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;

type ResponseInterceptors = {
  fulfilled: (value: unknown) => unknown;
  rejected: (error: AxiosError) => unknown;
};

function getRequestInterceptor(): RequestInterceptor {
  const handlers = (
    apiClient.interceptors.request as unknown as {
      handlers: Array<{ fulfilled: RequestInterceptor }>;
    }
  ).handlers;
  return handlers[0].fulfilled;
}

function getResponseInterceptors(): ResponseInterceptors {
  const handlers = (
    apiClient.interceptors.response as unknown as {
      handlers: Array<ResponseInterceptors>;
    }
  ).handlers;
  return handlers[0];
}

describe('apiClient interceptors', () => {
  afterEach(() => {
    setApiAccessTokenGetter(() => null);
    setApiUnauthorizedHandler(null);
  });

  it('attaches a Bearer token when the getter returns one', async () => {
    setApiAccessTokenGetter(() => 'tok-abc');
    const config = {
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig;
    const out = (await getRequestInterceptor()(
      config,
    )) as InternalAxiosRequestConfig;
    expect(out.headers.Authorization).toBe('Bearer tok-abc');
  });

  it('omits the Authorization header when the getter returns null', async () => {
    setApiAccessTokenGetter(() => null);
    const config = {
      headers: new AxiosHeaders(),
    } as InternalAxiosRequestConfig;
    const out = (await getRequestInterceptor()(
      config,
    )) as InternalAxiosRequestConfig;
    expect(out.headers.Authorization).toBeUndefined();
  });

  it('invokes the unauthorized handler on 401 responses then re-rejects', async () => {
    const handler = jest.fn();
    setApiUnauthorizedHandler(handler);
    const { rejected } = getResponseInterceptors();
    const error = { response: { status: 401 } } as AxiosError;

    await expect(rejected(error)).rejects.toBe(error);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not invoke the unauthorized handler for non-401 errors', async () => {
    const handler = jest.fn();
    setApiUnauthorizedHandler(handler);
    const { rejected } = getResponseInterceptors();
    const error = { response: { status: 500 } } as AxiosError;

    await expect(rejected(error)).rejects.toBe(error);
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not crash on 401 when no handler is registered', async () => {
    setApiUnauthorizedHandler(null);
    const { rejected } = getResponseInterceptors();
    const error = { response: { status: 401 } } as AxiosError;
    await expect(rejected(error)).rejects.toBe(error);
  });

  it('response success interceptor is the identity function', () => {
    const { fulfilled } = getResponseInterceptors();
    const res = { data: 'x' };
    expect(fulfilled(res)).toBe(res);
  });
});
