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
 * Request schema for PATCH /api/v1/users/me/profile.
 */
export const updateProfileSchema = z
  .object({
    email: optionalEmailSchema,
    name: z
      .string()
      .trim()
      .min(2, USER_MESSAGES.INVALID_NAME)
      .max(100, USER_MESSAGES.INVALID_NAME)
      .optional(),
  })
  .refine((value) => value.name !== undefined || value.email !== undefined, {
    message: USER_MESSAGES.INVALID_PROFILE_PAYLOAD,
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
