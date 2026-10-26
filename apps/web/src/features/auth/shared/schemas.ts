import { z } from "zod";

import {
  EMAIL_MAX,
  NAME_MAX,
  NAME_MIN,
  PASSWORD_MAX,
  PASSWORD_MIN,
  PHONE_E164_REGEX,
} from "./constants";

/**
 * Client-side zod schemas.
 *
 * Why duplicate the backend schema:
 * The server schema is the source of truth, but round-tripping every
 * keystroke to the server is unacceptable UX. Running the same rules on the
 * client gives instant inline feedback; the server re-validates and remains
 * authoritative. Duplication here is intentional and small.
 *
 * These only guard format — they never replace server validation.
 */

const emailSchema = z
  .string({ error: "Email must be a string" })
  .trim()
  .max(EMAIL_MAX, `Email must contain at most ${EMAIL_MAX} characters`)
  .pipe(z.email({ error: "Email format is invalid" }))
  .transform((email) => email.toLowerCase());

/**
 * Treats an empty optional form field as absent instead of invalid.
 *
 * Why preprocess:
 * HTML inputs always send a string, even when the user left them blank.
 * Without this, `""` would hit the regex and fail — even though the field
 * is optional. Mapping "" → undefined lets `.optional()` do its job.
 */
function emptyToUndefined(value: unknown): unknown {
  return typeof value === "string" && value.trim() === "" ? undefined : value;
}

const optionalPhoneSchema = z.preprocess(
  emptyToUndefined,
  z
    .string({ error: "Phone must be a string" })
    .trim()
    .regex(PHONE_E164_REGEX, "Phone must use E.164 format")
    .optional(),
);

export const registerSchema = z.strictObject({
  name: z
    .string({ error: "Name must be a string" })
    .trim()
    .min(NAME_MIN, `Name must contain at least ${NAME_MIN} characters`)
    .max(NAME_MAX, `Name must contain at most ${NAME_MAX} characters`),
  email: emailSchema,
  phone: optionalPhoneSchema,
  password: z
    .string({ error: "Password must be a string" })
    .min(
      PASSWORD_MIN,
      `Password must contain at least ${PASSWORD_MIN} characters`,
    )
    .max(
      PASSWORD_MAX,
      `Password must contain at most ${PASSWORD_MAX} characters`,
    ),
});

export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z
    .string({ error: "Password must be a string" })
    .min(1, "Password is required")
    .max(
      PASSWORD_MAX,
      `Password must contain at most ${PASSWORD_MAX} characters`,
    ),
});

export const forgotPasswordSchema = z.strictObject({
  email: emailSchema,
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password payload.
 *
 * Why no confirmPassword field:
 * The backend schema doesn't accept one — adding a client-only field would
 * create a shape mismatch. A single well-labeled input plus the show/hide
 * toggle in PasswordField is enough to prevent typos in practice.
 */
export const resetPasswordSchema = z.strictObject({
  email: emailSchema,
  code: z
    .string({ error: "Code must be a string" })
    .trim()
    .regex(/^\d{6}$/, "Code must be 6 digits"),
  newPassword: z
    .string({ error: "Password must be a string" })
    .min(
      PASSWORD_MIN,
      `Password must contain at least ${PASSWORD_MIN} characters`,
    )
    .max(
      PASSWORD_MAX,
      `Password must contain at most ${PASSWORD_MAX} characters`,
    ),
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
