import { api } from "@/lib/api/backend.client";

import type { LoginInput, LoginResponse } from "../../shared/types";

/**
 * Posts to the login endpoint.
 *
 * Why a thin wrapper:
 * Same rationale as register — the API util is transport-only. Naming the
 * endpoint, its input shape, and its response envelope here means the form
 * and hook stay ignorant of URL strings and payload structure.
 *
 * Note on cookies:
 * The route sets HttpOnly session cookies on success. The browser stores
 * them automatically; this wrapper does nothing explicit. That's the point
 * of cookie auth — JS never sees the token.
 */
export function loginApi(input: LoginInput): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", input);
}
