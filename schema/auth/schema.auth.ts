import { z } from "zod";

import { AUTH_MESSAGES } from "@/features/auth/constants/auth.constants";

/**
 * Validates Indian mobile numbers used for OTP-first auth.
 *
 * It accepts exactly 10 digits and requires the first digit to be 6-9,
 * matching common Indian mobile number ranges.
 */
const mobileSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, AUTH_MESSAGES.INVALID_MOBILE);

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(AUTH_MESSAGES.INVALID_EMAIL)
  .max(150);

const identifierSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(
    (value) => emailSchema.safeParse(value).success || mobileSchema.safeParse(value).success,
    AUTH_MESSAGES.INVALID_IDENTIFIER,
  );

/**
 * Allows email to be omitted or submitted as an empty string.
 *
 * Email is optional for this Hindi/mobile-first product, but when provided it
 * must still be normalized and valid.
 */
const optionalEmailSchema = emailSchema
  .optional()
  .or(z.literal(""));

const otpSchema = z.string().trim().regex(/^\d{6}$/, AUTH_MESSAGES.INVALID_OTP);

/**
 * Request schema for POST /api/v1/auth/register.
 *
 * Registration starts signup OTP only. User creation, avatar/profile setup,
 * branch selection, and session login are intentionally separate steps.
 */
export const registerSchema = z.object({
  email: optionalEmailSchema,
  mobile: mobileSchema,
  name: z.string().trim().min(2).max(100).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * Request schema for POST /api/v1/auth/register/verify.
 *
 * Verification is the point where the account is created and a session starts.
 */
export const verifyRegisterSchema = z.object({
  mobile: mobileSchema,
  otp: otpSchema,
});

export type VerifyRegisterInput = z.infer<typeof verifyRegisterSchema>;

/**
 * Request schema for POST /api/v1/auth/login.
 */
export const loginSchema = z.object({
  identifier: identifierSchema,
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Request schema for POST /api/v1/auth/login/verify.
 */
export const verifyLoginSchema = z.object({
  identifier: identifierSchema,
  otp: otpSchema,
});

export type VerifyLoginInput = z.infer<typeof verifyLoginSchema>;

export const checkIdentifierSchema = z.object({
  identifier: identifierSchema,
  purpose: z.enum(["LOGIN", "SIGNUP"]).default("SIGNUP"),
});

export type CheckIdentifierInput = z.infer<typeof checkIdentifierSchema>;

export const resendOtpSchema = z.object({
  identifier: identifierSchema,
  purpose: z.enum(["LOGIN", "SIGNUP"]),
});

export type ResendOtpInput = z.infer<typeof resendOtpSchema>;

/**
 * Request schema for POST /api/v1/auth/refresh.
 */
export const refreshSessionSchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    refreshToken: z.string().trim().min(20).optional(),
  }),
);

export type RefreshSessionInput = z.infer<typeof refreshSessionSchema>;
