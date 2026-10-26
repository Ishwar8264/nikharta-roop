import "server-only";

import { ACCESS_COOKIE_NAME } from "@/server/auth/auth.constants";
import { cookies } from "next/headers";

/**
 * JSON-serializable value.
 *
 * Why it exists:
 * Documents the shape we intend to send. Not enforced as the `json` param
 * type on the api methods — TypeScript interfaces don't get implicit index
 * signatures, so any interface would fail the structural check. The
 * serialization contract is enforced at runtime by JSON.stringify.
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
  /** Next.js Data Cache: seconds to cache. Mutually exclusive with `cache`. */
  revalidate?: number;
  /** Cache tags for on-demand revalidation via revalidateTag(). */
  tags?: string[];
  /** Standard Fetch cache mode. Ignored when `revalidate` is set. */
  cache?: RequestCache;
  /**
   * Skip cookie forwarding — for public, viewer-agnostic GETs that are safe
   * to store in the shared Data Cache without leaking per-user data.
   */
  skipAuth?: boolean;
}

/**
 * Normalized error thrown for every non-2xx response and network failure.
 *
 * Why:
 * Callers should never have to inspect `res.ok` or parse a Response. A single
 * error type with `status` + `data` lets `try/catch` distinguish 401 (redirect)
 * from 404 (empty state) from 500 (toast) in one place.
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

/**
 * Absolute URL to our own /api/v1 surface.
 *
 * Why absolute:
 * Node's fetch refuses relative URLs — there's no document to resolve
 * against. `NEXT_PUBLIC_APP_URL` is the single source of truth for the
 * origin, shared with client-side code.
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/v1`;

const DEFAULT_TIMEOUT_MS = 30_000;

async function request<T>(
  method: string,
  path: string,
  options: RequestOptions & { json?: unknown } = {},
): Promise<T> {
  const {
    json,
    headers: initHeaders,
    signal,
    revalidate,
    tags,
    cache,
    skipAuth,
    ...rest
  } = options;

  const headers = new Headers(initHeaders);
  headers.set("accept", "application/json");

  /**
   * Cookie + bearer forwarding.
   *
   * Why both:
   *   - Cookie keeps cookie-based auth working end-to-end (matches browser).
   *   - Bearer lets the route handler's CSRF guard short-circuit via its
   *     `hasBearerToken` check — server-to-server calls are not CSRF vectors,
   *     so we don't want them blocked by the double-submit requirement.
   */
  if (!skipAuth) {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();
    if (cookieHeader) headers.set("cookie", cookieHeader);

    const accessToken = cookieStore.get(ACCESS_COOKIE_NAME)?.value;
    if (accessToken) headers.set("authorization", `Bearer ${accessToken}`);
  }

  let body: string | undefined;
  if (json !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(json);
  }

  /**
   * Pick exactly one caching strategy.
   *
   * Why:
   * Next.js silently ignores BOTH `next.revalidate` and `cache` when they're
   * combined. Choosing one here keeps behaviour predictable and prevents the
   * classic "why isn't my cache working?" bug.
   */
  const cacheInit: RequestInit & {
    next?: { revalidate?: number; tags?: string[] };
  } =
    revalidate !== undefined
      ? { next: { revalidate, ...(tags ? { tags } : {}) } }
      : { cache: cache ?? "no-store" };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body,
      ...cacheInit,
      ...rest,
      /**
       * A custom AbortSignal opts a fetch out of cache reuse, so only attach
       * the default timeout on uncached requests. Data-cached reads don't
       * need one — they return from cache without touching the network.
       */
      signal:
        signal ??
        (revalidate !== undefined
          ? undefined
          : AbortSignal.timeout(DEFAULT_TIMEOUT_MS)),
    });
  } catch (error) {
    throw normalizeNetworkError(error);
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

/** Parses the response body only when it's declared as JSON. */
async function parseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  try {
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Extracts a human-readable message from the backend's error envelope.
 *
 * Why:
 * The backend's error shape (`{ message }` or `{ error: [{ message }] }`)
 * is the source of truth. Surfacing it verbatim makes debugging faster and
 * keeps client-side error copy consistent with server validation.
 */
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

/** Maps low-level fetch failures to typed ApiErrors. */
function normalizeNetworkError(error: unknown): ApiError {
  if (error instanceof Error && error.name === "AbortError") {
    return new ApiError(408, "Request timed out", null);
  }
  return new ApiError(0, "Backend unreachable", null);
}

/**
 * Centralized HTTP client for Server Components, Route Handlers, and Server
 * Actions. Every network call in server code goes through here.
 *
 * Usage:
 *   import { api } from "@/lib/api/backend.server";
 *   const salon = await api.get<Salon>("/salons/glamour-studio");
 *   await api.post("/appointments", { salonId, serviceId });
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
};
