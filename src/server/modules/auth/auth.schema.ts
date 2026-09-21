import { z } from "zod";

const optionalEmailSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .string({ error: "Email must be a string" })
    .trim()
    .max(254, "Email must contain at most 254 characters")
    .pipe(z.email({ error: "Email format is invalid" }))
    .transform((email) => email.toLowerCase())
    .optional(),
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
  .refine((input) => Boolean(input.email || input.phone), {
    message: "Email or phone is required",
    path: ["email"],
  });

/** Treats an empty optional form field as absent instead of invalid data. */
function emptyStringToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

// Login

/**
 * Login accepts either an email or a phone, plus a password.
 *
 * Why:
 * A single schema for both identifier types keeps the client contract simple
 * and matches the registration flow, which allows either identifier.
 */
export const loginUserSchema = z
  .strictObject({
    email: optionalEmailSchema,
    phone: optionalPhoneSchema,
    password: z
      .string({ error: "Password must be a string" })
      .min(1, "Password is required")
      .max(128, "Password must contain at most 128 characters"),
  })
  .refine((input) => Boolean(input.email || input.phone), {
    message: "Email or phone is required",
    path: ["email"],
  });
