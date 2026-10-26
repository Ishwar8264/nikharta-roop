/**
 * Client-side fetch wrapper.
 *
 * IMPORTANT: This file uses browser APIs (`document.cookie`, `window`).
 * It is meant for Client Components and event handlers only. Importing it
 * from a Server Component will not throw at build time, but any call that
 * touches the CSRF cookie will silently no-op during SSR — use the server
 * util there instead.
 */

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface RequestOptions {
  headers?: HeadersInit;
  signal?: AbortSignal;
}

/**
 * Normalized error for every non-2xx response and network failure.
 *
 * Why a mirrored class instead of a shared one:
 * The server util is marked `server-only`, so its exports cannot be imported
 * here. Duplicating the tiny error class keeps both files self-contained and
 * preserves `instanceof ApiError` checks in the runtime they belong to.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly data: unknown = null,
    public readonly retryAfterSeconds: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE_URL = "/api/v1";
const CSRF_COOKIE = "csrfToken";
const CSRF_HEADER = "x-csrf-token";
const REFRESH_PATH = "/api/v1/auth/refresh";
const REFRESH_LOCK_NAME = "auth-refresh";
const LAST_REFRESH_STORAGE_KEY = "auth:last-refresh-at";

/**
 * Endpoints where a 401 means "bad credentials", not "expired session".
 *
 * Why a denylist:
 * Refresh would be pointless (and could loop) for login/register, and the
 * refresh endpoint itself must never trigger its own retry.
 */
const NO_REFRESH_PATHS = new Set([
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
]);

/**
 * Single-flight refresh promise.
 *
 * Why:
 * Refresh tokens rotate and are single-use on the backend. If two requests
 * fire simultaneously and both get 401, they'd both try to refresh — the
 * first succeeds, the second presents the now-revoked token and nukes every
 * session (the backend's theft-detection path). Sharing one in-flight
 * promise collapses them into a single refresh.
 */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Reads the CSRF token from the double-submit cookie.
 *
 * Why cookie, not memory:
 * The token is issued alongside the session cookie so the two always agree.
 * Storing it in memory would break on a hard reload before any API call.
 */
function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${CSRF_COOKIE}=([^;]+)`),
  );
  if (!match) return null;

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

/**
 * Attempts to rotate the session via the refresh endpoint.
 *
 * Emits `auth:refreshed` on success and `auth:expired` on failure so the
 * AuthProvider (or any subscriber) can react — update state, redirect, etc.
 * The util itself never redirects; navigation is not a transport concern.
 */
async function attemptRefresh(): Promise<boolean> {
  if (refreshInFlight) {
    authDevLog("refresh_joined_in_flight");
    return refreshInFlight;
  }

  authDevLog("refresh_started", { hasCsrfCookie: readCsrfToken() !== null });

  refreshInFlight = withRefreshLock(async () => {
    const csrf = readCsrfToken();

    try {
      const res = await fetch(REFRESH_PATH, {
        method: "POST",
        credentials: "include",
        headers: csrf ? { [CSRF_HEADER]: csrf } : undefined,
      });

      authDevLog("refresh_response", { status: res.status });

      if (res.ok) {
        recordRefreshTime();
        authDevLog("refresh_succeeded");
        emit("auth:refreshed");
        return true;
      }

      authDevLog("refresh_rejected", { status: res.status });
      emit("auth:expired");
      return false;
    } catch (error) {
      // Network failure during refresh — leave the session alone. The next
      // request will retry; clearing state here would log out on flaky wifi.
      authDevLog("refresh_network_error", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
      return false;
    } finally {
      refreshInFlight = null;
    }
  });

  return refreshInFlight;
}

/**
 * Serializes refresh rotation across browser tabs when the Web Locks API is
 * available.
 *
 * Why:
 * The in-memory promise only protects one tab. Without a browser-wide lock,
 * two tabs can submit the same single-use refresh token and trigger replay
 * protection, which revokes the user's active sessions.
 */
async function withRefreshLock(task: () => Promise<boolean>): Promise<boolean> {
  if (typeof navigator === "undefined" || !("locks" in navigator)) {
    authDevLog("refresh_lock_unavailable");
    return task();
  }

  const csrfBeforeWaiting = readCsrfToken();

  return navigator.locks.request(REFRESH_LOCK_NAME, async () => {
    authDevLog("refresh_lock_acquired");

    // A changed CSRF cookie proves another tab already rotated the session
    // while this tab waited. Reuse its fresh cookies instead of rotating again.
    if (csrfBeforeWaiting && readCsrfToken() !== csrfBeforeWaiting) {
      recordRefreshTime();
      authDevLog("refresh_reused_from_other_tab");
      emit("auth:refreshed");
      return true;
    }

    return task();
  });
}

/**
 * Restores a cookie-backed browser session by rotating its refresh token.
 *
 * Why exported:
 * Protected document navigations cannot rotate cookies during Server
 * Component rendering, so the recovery page uses the same guarded refresh
 * operation as API retries.
 */
export function refreshSession(): Promise<boolean> {
  return attemptRefresh();
}

/** Returns the last successful browser refresh time without exposing tokens. */
export function getLastRefreshTime(): number | null {
  if (typeof window === "undefined") return null;

  let stored: string | null;
  try {
    stored = window.localStorage.getItem(LAST_REFRESH_STORAGE_KEY);
  } catch {
    // Storage can be disabled by privacy settings. Refresh still works; each
    // tab simply falls back to its own in-memory timer and the browser lock.
    authDevLog("refresh_storage_unavailable");
    return null;
  }

  if (!stored) return null;

  const timestamp = Number(stored);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

/** Writes auth lifecycle diagnostics in development without credential data. */
export function authDevLog(
  event: string,
  details: Record<string, boolean | number | string> = {},
): void {
  if (process.env.NODE_ENV === "production") return;
  console.debug(`[auth] ${event}`, details);
}

/** Shares refresh cadence across tabs; the stored value has no auth authority. */
function recordRefreshTime(): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LAST_REFRESH_STORAGE_KEY, String(Date.now()));
  } catch {
    authDevLog("refresh_storage_unavailable");
  }
}

/** Dispatches a CustomEvent in the browser only (no-op during SSR). */
function emit(name: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name));
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions & { json?: unknown } = {},
  retry = true,
): Promise<T> {
  const { json, headers: initHeaders, signal } = options;

  const headers = new Headers(initHeaders);
  headers.set("accept", "application/json");

  let body: string | undefined;
  if (json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(json);
  }

  /**
   * Attach CSRF header on every mutation.
   *
   * Why auto:
   * Route handlers reject cookie-authenticated mutations without this header.
   * Forgetting it on a single endpoint is an easy bug — centralizing it here
   * makes it structurally impossible.
   */
  if (isMutation(method)) {
    const csrf = readCsrfToken();
    if (csrf) headers.set(CSRF_HEADER, csrf);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body,
      credentials: "include",
      signal,
    });
  } catch {
    throw new ApiError(0, "Network error", null);
  }

  /**
   * Silent refresh + retry on 401.
   *
   * Why retry once, not loop:
   * If refresh succeeds, the access cookie is rotated; the original request
   * can go through with fresh credentials. If it fails again, refreshing
   * won't help — the caller needs to handle it (redirect, show error).
   */
  if (res.status === 401 && retry && !NO_REFRESH_PATHS.has(path)) {
    authDevLog("request_unauthorized_refreshing", { method, path });
    const refreshed = await attemptRefresh();
    if (refreshed) {
      authDevLog("request_retrying_after_refresh", { method, path });
      return request<T>(method, path, options, false);
    }
  }

  const data = await parseBody(res);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      extractMessage(data) ?? res.statusText,
      data,
      parseRetryAfter(res.headers.get("retry-after")),
    );
  }

  return data as T;
}

/** Parses the standard Retry-After seconds value used by auth cooldowns. */
function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? Math.ceil(seconds) : null;
}

async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

function extractMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  if (typeof record.message === "string") return record.message;

  if (Array.isArray(record.error) && record.error.length > 0) {
    const first = record.error[0];
    if (first && typeof first === "object") {
      const entry = first as Record<string, unknown>;
      if (typeof entry.message === "string") return entry.message;
    }
  }

  return null;
}

function isMutation(method: string): boolean {
  return (
    method === "POST" ||
    method === "PUT" ||
    method === "PATCH" ||
    method === "DELETE"
  );
}

/**
 * Centralized HTTP client for Client Components.
 *
 * Features:
 *   - Auto CSRF header on mutations
 *   - Auto single-flight refresh on 401
 *   - Auto retry once after a successful refresh
 *   - Typed ApiError with status + backend payload
 *
 * Usage:
 *   import { api } from "@/lib/api/backend.client";
 *   const { user } = await api.post<{ user: AuthUser }>("/auth/login", input);
 */
export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>("GET", path, options),

  post: <T>(path: string, json?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, json }),

  put: <T>(path: string, json?: unknown, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, json }),

  patch: <T>(path: string, json?: unknown, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, json }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),

  /**
   * DELETE with a JSON body.
   *
   * Why a separate method:
   * The shared `delete` signature types options as `RequestOptions` (no
   * `json` field) because DELETE-with-body is rare. A handful of routes —
   * notably `/auth/account` — require a body for a second-factor check, so
   * this method exposes the capability without changing the call shape of
   * every other DELETE caller.
   */
  deleteWithBody: <T>(path: string, json: unknown, options?: RequestOptions) =>
    request<T>("DELETE", path, { ...options, json }),
};
