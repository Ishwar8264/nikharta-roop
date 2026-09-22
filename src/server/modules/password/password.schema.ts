import { z } from "zod";

const emailSchema = z
  .string({ error: "Email must be a string" })
  .trim()
  .max(254, "Email must contain at most 254 characters")
  .pipe(z.email({ error: "Email format is invalid" }))
  .transform((email) => email.toLowerCase());

/** Password rules mirror registration so resets cannot weaken them. */
const passwordSchema = z
  .string({ error: "Password must be a string" })
  .min(8, "Password must contain at least 8 characters")
  .max(128, "Password must contain at most 128 characters");

export const forgotPasswordSchema = z.strictObject({
  email: emailSchema,
});

export const resetPasswordSchema = z.strictObject({
    email: emailSchema,
    code: z
      .string({ error: "Code must be a string" })
      .trim()
      .regex(/^\d{6}$/, "Code must be 6 digits"),
    newPassword: passwordSchema,
  });
