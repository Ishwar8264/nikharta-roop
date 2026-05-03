import { z } from "zod";

/**
 * Validates CUID identifiers accepted by service discovery endpoints.
 */
const idSchema = z.string().trim().cuid();

/**
 * Validates URL slugs used for category filters.
 */
const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(220)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must contain lowercase letters, numbers, and hyphens.",
  });

/**
 * Query schema for GET /api/v1/services/categories.
 */
export const listServiceCategoriesQuerySchema = z.object({
  branchId: z.preprocess(
    (value) => (value === "" ? undefined : value),
    idSchema.optional(),
  ),
});

/**
 * Query schema for GET /api/v1/services.
 */
export const listServicesQuerySchema = z
  .object({
    branchId: idSchema,
    categoryId: z.preprocess(
      (value) => (value === "" ? undefined : value),
      idSchema.optional(),
    ),
    categorySlug: z.preprocess(
      (value) => (value === "" ? undefined : value),
      slugSchema.optional(),
    ),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .refine((value) => !(value.categoryId && value.categorySlug), {
    message: "Use either categoryId or categorySlug, not both.",
    path: ["categorySlug"],
  });

/**
 * Query schema for GET /api/v1/services/:serviceId.
 */
export const getServiceQuerySchema = z.object({
  branchId: idSchema,
});

export type GetServiceQueryInput = z.infer<typeof getServiceQuerySchema>;
export type ListServiceCategoriesQueryInput = z.infer<
  typeof listServiceCategoriesQuerySchema
>;
export type ListServicesQueryInput = z.infer<typeof listServicesQuerySchema>;
