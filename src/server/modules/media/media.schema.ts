import { z } from "zod";

const resourceIdSchema = z
  .string({ error: "Resource ID must be a string" })
  .regex(
    /^(?:[a-f0-9]{48}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i,
    "Resource ID must be a valid identifier",
  );

/**
 * Persist an already-uploaded Cloudinary asset.
 *
 * Why no file field:
 * The file never touches our server. Cloudinary has the bytes; the client
 * only sends us the resulting URL + publicId. This schema describes that
 * contract — nothing about upload mechanics.
 */
export const createMediaAssetSchema = z.strictObject({
  url: z
    .string({ error: "URL must be a string" })
    .trim()
    .url("URL is invalid")
    .max(2048, "URL is too long"),
  publicId: z
    .string({ error: "Public ID must be a string" })
    .trim()
    .min(1, "Public ID is required")
    .max(255, "Public ID is too long")
    .regex(/^[^?&#\\%<>+]+$/, "Public ID contains invalid characters"),
  width: z
    .number({ error: "Width must be a number" })
    .int("Width must be an integer")
    .positive("Width must be positive")
    .optional(),
  height: z
    .number({ error: "Height must be a number" })
    .int("Height must be an integer")
    .positive("Height must be positive")
    .optional(),
  format: z
    .string({ error: "Format must be a string" })
    .trim()
    .min(1, "Format is required")
    .max(16, "Format is too long")
    .optional(),
  bytes: z
    .number({ error: "Bytes must be a number" })
    .int("Bytes must be an integer")
    .nonnegative("Bytes must be non-negative")
    .optional(),
  purpose: z
    .enum(
      ["GENERAL", "SALON", "PRODUCT", "SERVICE", "BLOG", "AVATAR", "REVIEW"],
      {
        error: "Purpose is invalid",
      },
    )
    .default("GENERAL"),
  attachedToType: z
    .string({ error: "Attachment type must be a string" })
    .trim()
    .max(32, "Attachment type is too long")
    .optional(),
  attachedToId: z
    .string({ error: "Attachment ID must be a string" })
    .trim()
    .max(80, "Attachment ID is too long")
    .optional(),
});

/**
 * Library list query — cursor pagination, no offset.
 *
 * Why cursor:
 * New uploads land at the top of the list. Offset pagination would shift
 * every subsequent page on each new insert and cause the client to see
 * duplicates or skips during infinite scroll.
 */
export const listMediaQuerySchema = z.strictObject({
  cursor: resourceIdSchema.optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .default(30),
  purpose: z
    .enum(
      ["GENERAL", "SALON", "PRODUCT", "SERVICE", "BLOG", "AVATAR", "REVIEW"],
      {
        error: "Purpose is invalid",
      },
    )
    .optional(),
  unattached: z
    .union([
      z.boolean(),
      z
        .enum(["true", "false"], {
          error: "unattached must be true or false",
        })
        .transform((value) => value === "true"),
    ])
    .optional(),
});

/** URL param for the delete route. */
export const mediaIdParamSchema = z.strictObject({
  id: resourceIdSchema,
});
