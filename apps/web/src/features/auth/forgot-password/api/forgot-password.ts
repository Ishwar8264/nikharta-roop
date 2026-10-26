import { api } from "@/lib/api/backend.client";

import type {
  ForgotPasswordInput,
  ForgotPasswordResponse,
} from "../../shared/types";

/**
 * Requests a password reset code by email.
 *
 * Why the response shape must not be inspected for existence:
 * The backend returns the same 200 payload whether or not the email is
 * registered — this endpoint must never be treated as an "account exists"
 * probe. The UI only reads `resendAvailableInSeconds` for the cooldown.
 */
export function forgotPasswordApi(
  input: ForgotPasswordInput,
): Promise<ForgotPasswordResponse> {
  return api.post<ForgotPasswordResponse>("/auth/password/forgot", input);
}
