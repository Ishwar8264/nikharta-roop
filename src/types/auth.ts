import type { z } from "zod";

import type {
  authSessionDataSchema,
  loginSchema,
  otpInputSchema,
  otpSentDataSchema,
  registerSchema,
  verifyOtpSchema,
} from "@/src/validations/auth/auth.validation";

// Capture request metadata used for auth auditing and request throttling.
export type AuthRequestContext = {
  ipAddress?: string;
  userAgent?: string;
};

// Derive the register payload directly from the shared runtime validation schema.
export type RegisterInput = z.infer<typeof registerSchema>;

// Derive the login payload directly from the matching runtime validation schema.
export type LoginInput = z.infer<typeof loginSchema>;

// Reuse the equivalent normalized login shape across every authentication entry point.
export type AuthIdentifierInput = LoginInput;

// Derive the OTP request result from the response data schema.
export type OtpSentData = z.infer<typeof otpSentDataSchema>;

// Derive the visible OTP form field from its shared validation schema.
export type OtpInput = z.infer<typeof otpInputSchema>;

// Derive the complete verification payload from the API validation schema.
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

// Reuse the API-supported purpose union across client flow configuration.
export type AuthPurpose = VerifyOtpInput["purpose"];

// Derive the authenticated user and token contract from runtime validation.
export type AuthSessionData = z.infer<typeof authSessionDataSchema>;
