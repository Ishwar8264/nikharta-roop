import { apiRequest } from "@/src/lib/api-client";
import type {
  AuthSessionData,
  AuthIdentifierInput,
  AuthPurpose,
  OtpSentData,
  VerifyOtpInput,
} from "@/src/types/auth";
import {
  authOtpSentResponseSchema,
  verifyOtpResponseSchema,
} from "@/src/validations/auth/auth.validation";

// Request an OTP through the purpose-specific endpoint without leaking routing into UI.
export const requestAuthOtp = (
  input: AuthIdentifierInput,
  purpose: AuthPurpose,
) => {
  // Keep login and registration endpoint selection inside the auth service.
  const endpoint = purpose === "LOGIN" ? "/auth/login" : "/auth/register";

  // Reuse the shared client so response validation and errors stay consistent.
  return apiRequest.post<OtpSentData, AuthIdentifierInput>(
    endpoint,
    input,
    authOtpSentResponseSchema,
  );
};

// Verify a login or signup OTP and establish the server-managed browser session.
export const verifyAuthOtp = (input: VerifyOtpInput) =>
  // Reuse the shared client so cookies and validated response data stay aligned.
  apiRequest.post<AuthSessionData, VerifyOtpInput>(
    "/auth/otp/verify",
    input,
    verifyOtpResponseSchema,
  );
