import type { AxiosError } from 'axios';
import {
  getApiMessageFromAxiosError,
  getFieldErrorsFromApiResponse,
  type BaseResponse,
} from './types';

describe('getFieldErrorsFromApiResponse', () => {
  it('returns undefined for missing body', () => {
    expect(getFieldErrorsFromApiResponse(undefined)).toBeUndefined();
  });

  it('returns undefined when both error sources are absent', () => {
    expect(getFieldErrorsFromApiResponse({ message: 'ok' })).toBeUndefined();
  });

  it('returns flat errors when body.errors is present', () => {
    expect(
      getFieldErrorsFromApiResponse({
        errors: { email: 'Invalid email', title: 'Required' },
      }),
    ).toEqual({ email: 'Invalid email', title: 'Required' });
  });

  it('returns nested errors from body.details.errors', () => {
    expect(
      getFieldErrorsFromApiResponse({
        details: { errors: { password: 'Too short' } },
      }),
    ).toEqual({ password: 'Too short' });
  });

  it('merges flat and nested with nested winning on key collision', () => {
    expect(
      getFieldErrorsFromApiResponse({
        errors: { email: 'Flat email' },
        details: { errors: { email: 'Nested email', title: 'Required' } },
      }),
    ).toEqual({ email: 'Nested email', title: 'Required' });
  });

  it('collapses array values to the first message', () => {
    expect(
      getFieldErrorsFromApiResponse({
        errors: { email: ['Required', 'Must be valid'] },
      }),
    ).toEqual({ email: 'Required' });
  });

  it('ignores empty array values', () => {
    expect(
      getFieldErrorsFromApiResponse({
        errors: { email: [] },
      }),
    ).toBeUndefined();
  });

  it('returns undefined when given a non-object body', () => {
    expect(
      getFieldErrorsFromApiResponse(null as unknown as BaseResponse),
    ).toBeUndefined();
  });
});

describe('getApiMessageFromAxiosError', () => {
  function makeError(overrides: Partial<AxiosError<BaseResponse>> = {}) {
    return {
      message: 'axios default',
      ...overrides,
    } as AxiosError<BaseResponse>;
  }

  it('falls back to error.message when there is no response', () => {
    expect(getApiMessageFromAxiosError(makeError())).toBe('axios default');
  });

  it("falls back to 'Request failed' when error.message is empty and no response", () => {
    expect(getApiMessageFromAxiosError(makeError({ message: '' }))).toBe(
      'Request failed',
    );
  });

  it('returns response.data.message when it is a non-empty string', () => {
    expect(
      getApiMessageFromAxiosError(
        makeError({
          response: { data: { message: 'Email already taken' } } as never,
        }),
      ),
    ).toBe('Email already taken');
  });

  it('returns first item of response.data.message when it is an array', () => {
    expect(
      getApiMessageFromAxiosError(
        makeError({
          response: {
            data: { message: ['First problem', 'Second problem'] as never },
          } as never,
        }),
      ),
    ).toBe('First problem');
  });

  it('falls back to details.message when top-level message is missing', () => {
    expect(
      getApiMessageFromAxiosError(
        makeError({
          response: {
            data: { details: { message: 'Detail explanation' } },
          } as never,
        }),
      ),
    ).toBe('Detail explanation');
  });

  it("returns 'Request failed' when nothing usable is available on the response", () => {
    expect(
      getApiMessageFromAxiosError(
        makeError({ response: { data: {} } as never }),
      ),
    ).toBe('Request failed');
  });
});
