import { api } from "@/lib/api/backend.client";

import type { SendOtpInput, SendOtpResponse } from "../../shared/types";

/**
 * Requests a fresh verification code.
 *
 * Why a thin wrapper:
 * Same rationale as register/login — keeps URL strings, payload shape, and
 * response envelope out of the form and hook.
 */
export function sendOtpApi(input: SendOtpInput): Promise<SendOtpResponse> {
  return api.post<SendOtpResponse>("/auth/otp/send", input);
}
