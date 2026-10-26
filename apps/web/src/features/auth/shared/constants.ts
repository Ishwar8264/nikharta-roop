/**
 * Auth field constraints shared by client-side validation.
 *
 * Why these live in one place:
 * The backend zod schema and the client-side zod schema must agree on
 * limits. Duplicating the numbers in two files guarantees drift — someone
 * bumps the max password length on the server, the client still rejects
 * at the old limit, and support tickets follow.
 *
 * These values MUST stay in sync with server/modules/auth/auth.schema.ts.
 */

export const NAME_MIN = 2;
export const NAME_MAX = 100;

export const EMAIL_MAX = 254;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export const PHONE_E164_REGEX = /^\+[1-9]\d{7,14}$/;

/**
 * Canonical field names.
 *
 * Why constants instead of string literals:
 * The backend returns `{ field: "email", message: "..." }`. The form reads
 * `fieldErrors[FIELD.email]`. A typo on either side silently drops the
 * error. Constants make both sides fail at compile time instead.
 */
export const FIELD = {
  name: "name",
  email: "email",
  phone: "phone",
  password: "password",
  currentPassword: "currentPassword",
  newPassword: "newPassword",
} as const;
