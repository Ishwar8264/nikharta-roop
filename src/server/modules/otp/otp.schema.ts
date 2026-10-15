import { z } from "zod";

import {
  COMMON_PASSWORD_MESSAGE,
  isCommonPassword,
} from "@/server/auth/breached-password";

const emailSchema = z
  .string({ error: "Email must be a string" })
  .trim()
  .max(254, "Email must contain at most 254 characters")
  .pipe(z.email({ error: "Email format is invalid" }))
  .transform((email) => email.toLowerCase());

/**
 * Identifies the user by email while phone delivery is unavailable.
 *
 * Why:
 * Keeping the unsupported phone field out of this strict schema prevents the
 * API from promising an SMS flow that cannot complete.
 */
export const sendOtpSchema = z.strictObject({
  staffActivation: z.boolean().optional(),
  email: emailSchema,
});

export const verifyOtpSchema = z
  .strictObject({
    email: emailSchema,
    createSession: z.boolean().optional(),
    newPassword: z
      .string({ error: "Password must be a string" })
      .min(8, "Password must contain at least 8 characters")
      .max(128, "Password must contain at most 128 characters")
      .refine((value) => !isCommonPassword(value), {
        message: COMMON_PASSWORD_MESSAGE,
      })
      .optional(),
    code: z
      .string({ error: "Code must be a string" })
      .trim()
      .regex(/^\d{6}$/, "Code must be 6 digits"),
  });
