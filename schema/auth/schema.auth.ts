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

/**
 * Allows email to be omitted or submitted as an empty string.
 *
 * Email is optional for this Hindi/mobile-first product, but when provided it
 * must still be normalized and valid.
 */
const optionalEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email(AUTH_MESSAGES.INVALID_EMAIL)
  .max(150)
  .optional()
  .or(z.literal(""));

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
