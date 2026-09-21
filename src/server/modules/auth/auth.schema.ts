import { z } from "zod";

const emailSchema = z
  .string({ error: "Email must be a string" })
  .trim()
  .max(254, "Email must contain at most 254 characters")
  .pipe(z.email({ error: "Email format is invalid" }))
  .transform((email) => email.toLowerCase());

const optionalEmailSchema = z.preprocess(
  emptyStringToUndefined,
  emailSchema.optional(),
);

const optionalPhoneSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string({ error: "Phone must be a string" })
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "Phone must use E.164 format")
    .optional(),
);

export const registerUserSchema = z
  .strictObject({
    name: z
      .string({ error: "Name must be a string" })
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(100, "Name must contain at most 100 characters"),
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    password: z
      .string({ error: "Password must be a string" })
      .min(8, "Password must contain at least 8 characters")
      .max(128, "Password must contain at most 128 characters"),
  })
  .refine((input) => Boolean(input.email), {
    message: "Email is required; phone authentication is not available yet",
    path: ["email"],
  });

/** Treats an empty optional form field as absent instead of invalid data. */
function emptyStringToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

// Login

/**
 * Login currently accepts verified email credentials.
 *
 * Why:
 * Phone remains storable on a profile, but accepting phone login before an
 * SMS provider exists would create accounts that can never be verified.
 */
export const loginUserSchema = z
  .strictObject({
    email: emailSchema,
    password: z
      .string({ error: "Password must be a string" })
      .min(1, "Password is required")
      .max(128, "Password must contain at most 128 characters"),
  });
