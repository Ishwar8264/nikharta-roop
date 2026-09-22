import { z } from "zod";

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
  email: emailSchema,
});

export const verifyOtpSchema = z
  .strictObject({
    email: emailSchema,
    code: z
      .string({ error: "Code must be a string" })
      .trim()
      .regex(/^\d{6}$/, "Code must be 6 digits"),
  });
