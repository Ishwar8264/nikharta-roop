import { api } from "@/lib/api/backend.client";

import type { VerifyOtpInput, VerifyOtpResponse } from "../../shared/types";

/**
 * Submits the 6-digit code for verification.
 *
 * Why a thin wrapper:
 * Same rationale as send — the form should not know the endpoint or shape.
 */
export function verifyOtpApi(
  input: VerifyOtpInput,
): Promise<VerifyOtpResponse> {
  return api.post<VerifyOtpResponse>("/auth/otp/verify", input);
}
