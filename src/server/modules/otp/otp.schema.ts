import { z } from "zod";

const emailSchema = z
  .string({ error: "Email must be a string" })
  .trim()
  .max(254, "Email must contain at most 254 characters")
  .pipe(z.email({ error: "Email format is invalid" }))
  .transform((email) => email.toLowerCase());

const phoneSchema = z
  .string({ error: "Phone must be a string" })
  .trim()
  .regex(/^\+[1-9]\d{7,14}$/, "Phone must use E.164 format");

/**
 * Identifies the user by exactly one of email or phone.
 *
 * Why:
 * The `refine` check rejects requests that supply both identifiers or
 * neither, keeping the channel resolution unambiguous downstream.
 */
export const sendOtpSchema = z
  .strictObject({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
  })
  .refine((input) => Boolean(input.email) !== Boolean(input.phone), {
    message: "Provide exactly one of email or phone",
    path: ["email"],
  });

export const verifyOtpSchema = z
  .strictObject({
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    code: z
      .string({ error: "Code must be a string" })
      .trim()
      .regex(/^\d{6}$/, "Code must be 6 digits"),
  })
  .refine((input) => Boolean(input.email) !== Boolean(input.phone), {
    message: "Provide exactly one of email or phone",
    path: ["email"],
  });
