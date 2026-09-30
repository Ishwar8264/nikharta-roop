import { z } from "zod";

const optionalText = (max: number, message: string) =>
  z.string().trim().max(max, message).optional();

const optionalUrl = z
  .string()
  .trim()
  .url("URL is invalid")
  .max(2048, "URL is too long");

/** Client-side service-create validation for immediate form feedback. */
export const createServiceFormSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(120, "Name must contain at most 120 characters"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug must contain at least 2 characters")
    .max(80, "Slug must contain at most 80 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain only lowercase letters, numbers, and hyphens",
    )
    .refine((slug) => slug !== "create", {
      message: "This service slug is reserved",
    })
    .optional(),
  categoryId: z.string().regex(/^(?:[a-f0-9]{48}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i, "Resource ID must be a valid identifier").optional(),
  price: z
    .number({ error: "Price must be a number" })
    .min(0, "Price cannot be negative")
    .max(10_000_000, "Price is too large")
    .multipleOf(0.01, "Price must have at most 2 decimal places"),
  duration: z
    .number({ error: "Duration must be a number" })
    .int("Duration must be an integer")
    .min(5, "Duration must be at least 5 minutes")
    .max(480, "Duration must be at most 480 minutes"),
  isActive: z.boolean(),
  shortDescription: optionalText(
    280,
    "Short description must contain at most 280 characters",
  ),
  description: optionalText(
    5000,
    "Description must contain at most 5000 characters",
  ),
  descriptionHtml: optionalText(20000, "HTML description is too long"),
  descriptionJson: optionalText(50000, "JSON description is too long"),
  images: z
    .array(optionalUrl)
    .max(10, "At most 10 images are allowed"),
});

export type CreateServiceFormValues = z.infer<typeof createServiceFormSchema>;

/** Converts a service name into an editable URL-safe suggestion. */
export function slugifyServiceName(value: string): string | undefined {
  const slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
  return slug.length >= 2 ? slug : undefined;
}
