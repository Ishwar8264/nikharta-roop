import { z } from "zod";

/**
 * Client-side validation mirroring the server's createSalonSchema.
 *
 * Why a separate copy:
 * The server schema lives behind `server-only` and pulls Prisma types. This
 * file stays pure zod + zero runtime imports so client forms can validate
 * without dragging the server module into the bundle.
 *
 * MUST stay in sync with server/modules/salon/salon.schema.ts.
 */

const slugSchema = z
  .string()
  .trim()
  .min(2, "Slug must contain at least 2 characters")
  .max(80, "Slug must contain at most 80 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens",
  );

export const createSalonSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(120, "Name must contain at most 120 characters"),
  slug: slugSchema.optional(),
  shortDescription: z
    .string({ error: "Short description must be a string" })
    .trim()
    .max(280, "Short description must contain at most 280 characters")
    .optional(),
  description: z
    .string({ error: "Description must be a string" })
    .trim()
    .max(5000, "Description must contain at most 5000 characters")
    .optional(),
  descriptionHtml: z
    .string({ error: "HTML description must be a string" })
    .max(20000, "HTML description is too long")
    .optional(),
  descriptionJson: z
    .string({ error: "JSON description must be a string" })
    .max(50000, "JSON description is too long")
    .optional(),
  category: z.enum(["MALE", "FEMALE", "UNISEX", "KIDS"]).default("UNISEX"),
  address: z
    .string()
    .trim()
    .min(5, "Address must contain at least 5 characters")
    .max(500, "Address must contain at most 500 characters"),
  city: z
    .string({ error: "City must be a string" })
    .trim()
    .min(1, "City must not be empty")
    .max(80, "City must contain at most 80 characters"),
  state: z
    .string({ error: "State must be a string" })
    .trim()
    .min(1, "State must not be empty")
    .max(80, "State must contain at most 80 characters"),
  zip: z
    .string({ error: "ZIP must be a string" })
    .trim()
    .min(3, "ZIP must contain at least 3 characters")
    .max(12, "ZIP must contain at most 12 characters"),
  country: z
    .string({ error: "Country must be a string" })
    .trim()
    .length(2, "Country must be an ISO 3166-1 alpha-2 code")
    .toUpperCase()
    .default("IN"),
  timezone: z
    .string({ error: "Timezone must be a string" })
    .trim()
    .min(1, "Timezone must not be empty")
    .max(64, "Timezone must contain at most 64 characters")
    .default("Asia/Kolkata"),
  lat: z
    .number({ error: "Latitude must be a number" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  lng: z
    .number({ error: "Longitude must be a number" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  placeId: z.string().trim().max(255).optional(),
  phone: z
    .string()
    .trim()
    .regex(/^\+[1-9]\d{7,14}$/, "Phone must use E.164 format")
    .optional(),
  email: z
    .string({ error: "Email must be a string" })
    .trim()
    .max(254, "Email must contain at most 254 characters")
    .pipe(z.email({ error: "Email format is invalid" }))
    .transform((email) => email.toLowerCase())
    .optional(),
  coverImage: z.string().trim().url("URL is invalid").max(2048).optional(),
  bannerImage: z.string().trim().url("URL is invalid").max(2048).optional(),
  images: z
    .array(z.string().url("URL is invalid"), {
      error: "Images must be an array of URLs",
    })
    .max(20, "At most 20 images are allowed")
    .default([]),
});

export type CreateSalonFormInput = z.input<typeof createSalonSchema>;
export type CreateSalonFormValues = z.output<typeof createSalonSchema>;

/** Slug helper used by the form to auto-fill the slug field from name. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
