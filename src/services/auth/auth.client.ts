import { apiRequest } from "@/src/lib/api-client";
import type {
  AuthSessionData,
  OtpSentData,
  RegisterInput,
  VerifyOtpInput,
} from "@/src/types/auth";
import {
  registerResponseSchema,
  verifyOtpResponseSchema,
} from "@/src/validations/auth/auth.validation";

// Request a signup OTP through the dedicated register endpoint.
export const registerUser = (input: RegisterInput) =>
  // Reuse the shared client so response validation and errors stay consistent.
  apiRequest.post<OtpSentData, RegisterInput>(
    "/auth/register",
    input,
    registerResponseSchema,
  );

// Verify a signup OTP and establish the server-managed browser session.
export const verifySignupOtp = (input: VerifyOtpInput) =>
  // Reuse the shared client so cookies and validated response data stay aligned.
  apiRequest.post<AuthSessionData, VerifyOtpInput>(
    "/auth/otp/verify",
    input,
    verifyOtpResponseSchema,
  );
