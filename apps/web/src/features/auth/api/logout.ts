import { api } from "@/lib/api/backend.client";

import type { LogoutResponse } from "../shared/types";

/**
 * Ends the server-side session and clears cookies.
 *
 * Why POST, not GET:
 * Logout revokes the refresh token server-side — a state mutation. GET
 * requests must be safe and idempotent per HTTP semantics; browsers and
 * proxies may pre-fetch them. POST is the correct verb.
 *
 * Idempotent by design:
 * The backend returns 200 even when no session existed, so calling this
 * twice is harmless.
 */
export function logoutApi(): Promise<LogoutResponse> {
  return api.post<LogoutResponse>("/auth/logout");
}
