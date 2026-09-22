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
export const loginUserSchema = z.strictObject({
  email: emailSchema,
  password: z
    .string({ error: "Password must be a string" })
    .min(1, "Password is required")
    .max(128, "Password must contain at most 128 characters"),
});

const passwordRuleSchema = z
  .string({ error: "Password must be a string" })
  .min(8, "Password must contain at least 8 characters")
  .max(128, "Password must contain at most 128 characters");

/**
 * Change password requires the caller to prove they know the current one.
 *
 * Why:
 * An attacker who steals an access token should not be able to lock the real
 * owner out. Requiring the current password makes a stolen token insufficient
 * on its own to change credentials.
 */
export const changePasswordSchema = z.strictObject({
  currentPassword: z
    .string({ error: "Current password must be a string" })
    .min(1, "Current password is required")
    .max(128, "Current password must contain at most 128 characters"),
  newPassword: passwordRuleSchema,
});

/**
 * Profile updates accept any subset of editable fields.
 *
 * Why:
 * `refine` rejects empty bodies so a client sending `{}` gets a clear 400
 * instead of a silent no-op that looks successful.
 */
export const updateProfileSchema = z
  .strictObject({
    name: z
      .string({ error: "Name must be a string" })
      .trim()
      .min(2, "Name must contain at least 2 characters")
      .max(100, "Name must contain at most 100 characters")
      .nullable()
      .optional(),
    avatar: z
      .string({ error: "Avatar must be a string" })
      .trim()
      .url("Avatar must be a valid URL")
      .max(2048, "Avatar URL is too long")
      .nullable()
      .optional(),
    bio: z
      .string({ error: "Bio must be a string" })
      .trim()
      .max(500, "Bio must contain at most 500 characters")
      .nullable()
      .optional(),
    lat: z
      .number({ error: "Latitude must be a number" })
      .min(-90, "Latitude must be between -90 and 90")
      .max(90, "Latitude must be between -90 and 90")
      .nullable()
      .optional(),
    lng: z
      .number({ error: "Longitude must be a number" })
      .min(-180, "Longitude must be between -180 and 180")
      .max(180, "Longitude must be between -180 and 180")
      .nullable()
      .optional(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    { message: "At least one field must be provided" },
  );

/**
 * Delete account requires re-authentication with the current password.
 *
 * Why:
 * Deletion is destructive and irreversible from the user's point of view.
 * Requiring the password prevents a stolen access token from being enough to
 * nuke the account. This mirrors the confirmation flow used by GitHub, Slack,
 * and other production systems.
 */
export const deleteAccountSchema = z.strictObject({
  password: z
    .string({ error: "Password must be a string" })
    .min(1, "Password is required to confirm account deletion")
    .max(128, "Password must contain at most 128 characters"),
});

/** Validates both legacy UUIDs and the current 48-character ID format. */
export const sessionIdSchema = z
  .string({ error: "Session ID must be a string" })
  .regex(
    /^(?:[a-f0-9]{48}|[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12})$/i,
    "Session ID format is invalid",
  );
