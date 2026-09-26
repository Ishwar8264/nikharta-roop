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
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const BASE_URL = "/api/v1";
const CSRF_COOKIE = "csrfToken";
const CSRF_HEADER = "x-csrf-token";
const REFRESH_PATH = "/api/v1/auth/refresh";

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
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(REFRESH_PATH, {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        emit("auth:refreshed");
        return true;
      }

      emit("auth:expired");
      return false;
    } catch {
      // Network failure during refresh — leave the session alone. The next
      // request will retry; clearing state here would log out on flaky wifi.
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Dispatches a CustomEvent in the browser only (no-op during SSR). */
function emit(name: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(name));
}

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions & { json?: JsonValue } = {},
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
    const refreshed = await attemptRefresh();
    if (refreshed) {
      return request<T>(method, path, options, false);
    }
  }

  const data = await parseBody(res);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      extractMessage(data) ?? res.statusText,
      data,
    );
  }

  return data as T;
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

  post: <T>(path: string, json?: JsonValue, options?: RequestOptions) =>
    request<T>("POST", path, { ...options, json }),

  put: <T>(path: string, json?: JsonValue, options?: RequestOptions) =>
    request<T>("PUT", path, { ...options, json }),

  patch: <T>(path: string, json?: JsonValue, options?: RequestOptions) =>
    request<T>("PATCH", path, { ...options, json }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>("DELETE", path, options),
};
