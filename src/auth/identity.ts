import { API_BASE_URL } from '../api/config';

const USER_ID_STORAGE_KEY = 'workspace_user_id';
const USER_ID_COOKIE = 'user_id';
/** Optional Bearer JWT (claim `sub` = user UUID). Prefer over cookie when set. */
const JWT_STORAGE_KEY = 'workspace_auth_token';

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

function createUserId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** True when VITE_API_URL points at a different origin than the page. */
export function isCrossOriginApi(): boolean {
  if (!isBrowser()) return false;
  try {
    if (!/^https?:\/\//i.test(API_BASE_URL)) return false;
    return new URL(API_BASE_URL).origin !== window.location.origin;
  } catch {
    return false;
  }
}

function readCookie(name: string): string | null {
  if (!isBrowser()) return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeUserIdCookie(userId: string): void {
  if (!isBrowser()) return;

  // Cross-origin APIs cannot receive a frontend-domain cookie; callers should use JWT.
  const maxAge = 60 * 60 * 24 * 365;
  const crossOrigin = isCrossOriginApi();
  const sameSite = crossOrigin ? 'None' : 'Lax';
  const secure =
    crossOrigin || window.location.protocol === 'https:' ? '; Secure' : '';

  document.cookie = `${USER_ID_COOKIE}=${encodeURIComponent(userId)}; path=/; Max-Age=${maxAge}; SameSite=${sameSite}${secure}`;
}

/** Stable per-browser user UUID (localStorage). Does not touch the cookie. */
export function getStoredUserId(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(USER_ID_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(JWT_STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Persist a backend-issued JWT (HS256, `sub` = user UUID). Clears need for cookie auth. */
export function setAuthToken(token: string | null): void {
  if (!isBrowser()) return;
  try {
    if (token) {
      localStorage.setItem(JWT_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(JWT_STORAGE_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Ensure a stable user id exists and sync the `user_id` cookie (for cookie auth).
 * Returns the user UUID.
 */
export function ensureIdentity(): string {
  let userId = getStoredUserId();
  if (!userId) {
    userId = createUserId();
    try {
      localStorage.setItem(USER_ID_STORAGE_KEY, userId);
    } catch {
      // still set cookie so this session can authenticate
    }
  }

  const cookieId = readCookie(USER_ID_COOKIE);
  if (cookieId !== userId) {
    writeUserIdCookie(userId);
  }

  return userId;
}

/** Replace identity after 401 / missing auth — new UUID + cookie. */
export function resetIdentity(): string {
  const userId = createUserId();
  try {
    localStorage.setItem(USER_ID_STORAGE_KEY, userId);
  } catch {
    // ignore
  }
  // Stale JWT would keep failing auth; drop it when regenerating identity.
  setAuthToken(null);
  writeUserIdCookie(userId);
  return userId;
}

/**
 * Headers for authenticated API calls.
 * Prefer Bearer JWT when present; otherwise rely on `user_id` cookie + credentials.
 */
export function getIdentityHeaders(): HeadersInit {
  const userId = ensureIdentity();
  const token = getAuthToken();
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  // No JWT: carry the per-browser id in a header so it survives a cross-origin
  // (different-domain) API call, where the `user_id` cookie would not be sent.
  return { 'X-User-Id': userId };
}
