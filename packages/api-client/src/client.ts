import { API_BASE_PATH, type ApiResponse, type HealthStatus } from "@nikharta-roop/shared";

export class ApiClientError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

export type ApiClientOptions = {
  /** Origin of the web app, e.g. https://example.com or http://192.168.1.10:3000 */
  baseUrl: string;
  /** Returns the current auth token (if any) to send as a Bearer token. */
  getToken?: () => string | null | undefined | Promise<string | null | undefined>;
};

/** HTTP helpers own the verb and JSON body; callers can pass headers, cancellation and cache options. */
export type ApiRequestOptions = Omit<RequestInit, "method" | "body">;

export function createApiClient({ baseUrl, getToken }: ApiClientOptions) {
  const root = baseUrl.replace(/\/+$/, "");

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (init.body !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    const token = await getToken?.();
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const res = await fetch(`${root}${API_BASE_PATH}${path}`, { ...init, headers });
    const body = (await res.json().catch(() => null)) as ApiResponse<T> | null;

    // Check the envelope only; each endpoint owns validation of its data.
    if (
      !body ||
      typeof body !== "object" ||
      typeof body.ok !== "boolean" ||
      (body.ok
        ? !("data" in body)
        : !body.error ||
          typeof body.error.code !== "string" ||
          typeof body.error.message !== "string")
    ) {
      throw new ApiClientError(
        "INVALID_RESPONSE",
        `Unexpected response (${res.status})`,
        res.status,
      );
    }
    if (!body.ok) {
      throw new ApiClientError(body.error.code, body.error.message, res.status, body.error.details);
    }
    if (!res.ok) {
      throw new ApiClientError("HTTP_ERROR", `Request failed (${res.status})`, res.status);
    }
    return body.data;
  }

  return {
    request,
    get: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "GET" }),
    post: <T>(path: string, data?: unknown, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "POST", body: JSON.stringify(data) }),
    put: <T>(path: string, data?: unknown, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "PUT", body: JSON.stringify(data) }),
    patch: <T>(path: string, data?: unknown, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "PATCH", body: JSON.stringify(data) }),
    delete: <T>(path: string, options?: ApiRequestOptions) =>
      request<T>(path, { ...options, method: "DELETE" }),
    health: () => request<HealthStatus>("/health"),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** Ready-to-use same-origin browser client; mobile and external hosts use createApiClient. */
export const api = createApiClient({ baseUrl: "" });
