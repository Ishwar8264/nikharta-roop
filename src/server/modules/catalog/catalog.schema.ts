import { z } from "zod";

/**
 * Template keys are stable dotted refs like "svc.haircut.men". They exist so
 * seed data and API calls reference a template without knowing its id.
 */
export const templateKeySchema = z
  .string({ error: "Template key must be a string" })
  .trim()
  .min(3, "Template key must contain at least 3 characters")
  .max(80, "Template key must contain at most 80 characters")
  .regex(
    /^[a-z0-9]+(?:\.[a-z0-9]+(?:-[a-z0-9]+)*)*$/,
    "Template key must be lowercase letters, digits, dots, and hyphens",
  );

export const templateKeyParamSchema = z.strictObject({
  templateKey: templateKeySchema,
});

/** Public catalog query — the catalog is small, so filtering beats pagination. */
export const listTemplatesQuerySchema = z.strictObject({
  kind: z.enum(["SERVICE", "PACKAGE"], { error: "Kind is invalid" }).optional(),
});

/** Body for activating/updating a salon template. */
export const activateTemplateSchema = z.strictObject({
  templateKey: templateKeySchema,
  price: z
    .number({ error: "Price must be a number" })
    .positive("Price must be greater than 0")
    .max(10_000_000, "Price is too large"),
});

export const updateSalonTemplateSchema = z
  .strictObject({
    price: z
      .number({ error: "Price must be a number" })
      .positive("Price must be greater than 0")
      .max(10_000_000, "Price is too large")
      .optional(),
    isActive: z
      .boolean({ error: "Active flag must be a boolean" })
      .optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });
