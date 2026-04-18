import type { AxiosError } from 'axios';

/** Common envelope fields returned by Smart Triage Nest handlers. */
export type BaseResponse<T = unknown> = {
  message?: string;
  status?: boolean;
  statusCode?: string;
  data?: T;
  /** Flat field errors (some endpoints). */
  errors?: Record<string, string | string[]>;
  /** Nested validation details (e.g. Nest-style). */
  details?: {
    errors?: Record<string, string | string[]>;
    message?: string | string[];
  };
};

export type PaginatedTicketsData<T> = {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
};

function firstMessage(
  value: string | string[] | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Normalize API error payloads into react-hook-form field messages.
 * Handles `errors` and `details.errors` per api-field-errors rule.
 */
export function getFieldErrorsFromApiResponse(
  body: BaseResponse | undefined,
): Record<string, string> | undefined {
  if (!body || typeof body !== 'object') return undefined;

  const flat = body.errors;
  const nested = body.details?.errors;
  const merged: Record<string, string | string[]> = {
    ...(typeof flat === 'object' && flat ? flat : {}),
    ...(typeof nested === 'object' && nested ? nested : {}),
  };

  const out: Record<string, string> = {};
  for (const [key, val] of Object.entries(merged)) {
    const msg = firstMessage(val);
    if (msg) out[key] = msg;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

export function getApiMessageFromAxiosError(
  error: AxiosError<BaseResponse>,
): string {
  const d = error.response?.data;
  if (!d) return error.message || 'Request failed';
  if (typeof d.message === 'string' && d.message) return d.message;
  if (Array.isArray(d.message) && d.message[0]) return String(d.message[0]);
  if (typeof d.details?.message === 'string' && d.details.message)
    return d.details.message;
  return d.message ? String(d.message) : 'Request failed';
}
