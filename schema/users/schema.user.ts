import { z } from "zod";

import { USER_MESSAGES } from "../../features/users/constants/user.constants";

/**
 * Normalizes optional email input for profile updates.
 */
const optionalEmailSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .string()
    .trim()
    .toLowerCase()
    .email(USER_MESSAGES.INVALID_EMAIL)
    .max(150)
    .nullable()
    .optional(),
);

/**
 * URL fields accept an empty string when the user clears a saved value.
 */
const optionalUrlSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().url().nullable().optional(),
);

/**
 * Optional CUID values accept an empty string when the user clears a selection.
 */
const optionalIdSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z.string().trim().cuid().nullable().optional(),
);

const notificationPreferencesSchema = z
  .object({
    bookingReminders: z.boolean().optional(),
    email: z.boolean().optional(),
    offers: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
    whatsapp: z.boolean().optional(),
  })
  .strict();

/**
 * Request schema for PATCH /api/v1/users/me/profile.
 */
export const updateProfileSchema = z
  .object({
    avatarUrl: optionalUrlSchema,
    branchId: optionalIdSchema,
    email: optionalEmailSchema,
    name: z
      .string()
      .trim()
      .min(2, USER_MESSAGES.INVALID_NAME)
      .max(100, USER_MESSAGES.INVALID_NAME)
      .optional(),
    notificationPreferences: notificationPreferencesSchema.optional(),
  })
  .refine(
    (value) =>
      value.avatarUrl !== undefined ||
      value.branchId !== undefined ||
      value.email !== undefined ||
      value.name !== undefined ||
      value.notificationPreferences !== undefined,
    {
      message: USER_MESSAGES.INVALID_PROFILE_PAYLOAD,
    },
  );

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Request schema for POST /api/v1/users/me/avatar.
 *
 * The image file itself should be uploaded to Cloudinary/S3 by the client or a
 * dedicated storage service before this endpoint is called.
 */
export const updateAvatarSchema = z.object({
  avatarUrl: z
    .string()
    .trim()
    .url(USER_MESSAGES.INVALID_AVATAR_URL)
    .max(2048, USER_MESSAGES.INVALID_AVATAR_URL)
    .refine((value) => value.startsWith("https://"), {
      message: USER_MESSAGES.INVALID_AVATAR_URL,
    }),
});

export type UpdateAvatarInput = z.infer<typeof updateAvatarSchema>;

const addressBaseSchema = z.object({
  branchId: optionalIdSchema,
  city: z.string().trim().min(2).max(100),
  isDefault: z.boolean().optional(),
  label: z.string().trim().max(80).nullable().optional(),
  landmark: z.string().trim().max(200).nullable().optional(),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  line1: z.string().trim().min(3).max(240),
  line2: z.string().trim().max(240).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  mobile: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/)
    .nullable()
    .optional(),
  postalCode: z.string().trim().max(12).nullable().optional(),
  recipientName: z.string().trim().max(100).nullable().optional(),
  state: z.string().trim().max(100).nullable().optional(),
});

/**
 * Request schema for POST /api/v1/users/me/addresses.
 */
export const createAddressSchema = addressBaseSchema;

/**
 * Request schema for PATCH /api/v1/users/me/addresses/:addressId.
 */
export const updateAddressSchema = addressBaseSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: USER_MESSAGES.INVALID_ADDRESS_PAYLOAD,
  });

export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
