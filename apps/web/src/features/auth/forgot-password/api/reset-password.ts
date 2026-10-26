import { api } from "@/lib/api/backend.client";

import type {
  ResetPasswordInput,
  ResetPasswordResponse,
} from "../../shared/types";

/**
 * Completes the reset with the emailed code and a new password.
 *
 * Why this returns no tokens:
 * The backend intentionally revokes every refresh token inside the reset
 * transaction — a password change is a security event and all existing
 * sessions must die. The user is expected to sign in again with the new
 * credentials, so the caller redirects to /login rather than auto-entering
 * a session.
 */
export function resetPasswordApi(
  input: ResetPasswordInput,
): Promise<ResetPasswordResponse> {
  return api.post<ResetPasswordResponse>("/auth/password/reset", input);
}
