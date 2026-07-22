import { ensureIdentity, getIdentityHeaders, resetIdentity } from '../auth/identity';
import { API_BASE_URL } from './config';

export const FORBIDDEN_WORKSPACE_MESSAGE =
  "You don't have access to this workspace";

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export function isForbiddenError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.status === 403 || err.code === 'FORBIDDEN')
  );
}

export function isUnauthorizedError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    (err.status === 401 || err.code === 'UNAUTHORIZED')
  );
}

export function messageFromApiError(err: unknown, fallback: string): string {
  if (isForbiddenError(err)) {
    return FORBIDDEN_WORKSPACE_MESSAGE;
  }
  if (err instanceof ApiError) {
    return err.message || fallback;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

function parseApiError(text: string, status: number, statusText: string): ApiError {
  if (!text) {
    return new ApiError(statusText || `Request failed (${status})`, status);
  }

  try {
    const body = JSON.parse(text) as { error?: string; code?: string };
    const message =
      typeof body.error === 'string' && body.error
        ? body.error
        : text;
    return new ApiError(message, status, body.code);
  } catch {
    return new ApiError(text, status);
  }
}

type ApiFetchOptions = RequestInit & {
  /** Skip one automatic identity reset + retry on 401. */
  skipAuthRetry?: boolean;
};

/**
 * Authenticated fetch against the Django API.
 * Attaches Bearer JWT when present, otherwise relies on `user_id` cookie.
 */
export async function apiFetch(
  path: string,
  init: ApiFetchOptions = {},
): Promise<Response> {
  ensureIdentity();

  const { skipAuthRetry, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);
  if (!headers.has('Content-Type') && rest.body != null) {
    headers.set('Content-Type', 'application/json');
  }
  const identityHeaders = getIdentityHeaders();
  for (const [key, value] of Object.entries(identityHeaders)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && !skipAuthRetry) {
    resetIdentity();
    return apiFetch(path, { ...init, skipAuthRetry: true });
  }

  return res;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw parseApiError(text, res.status, res.statusText);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

/** Throw ApiError from a non-OK response (for callers using apiFetch directly). */
export async function throwIfNotOk(res: Response, fallbackMessage: string): Promise<void> {
  if (res.ok) return;
  const text = await res.text();
  throw parseApiError(text || fallbackMessage, res.status, res.statusText);
}
