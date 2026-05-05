import { z } from "zod";

/**
 * Validates CUID identifiers accepted by package endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(220)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "Slug must contain lowercase letters, numbers, and hyphens.",
  });

/**
 * Validates positive money amounts sent by admin package forms.
 */
const moneySchema = z.coerce.number().min(0).max(999999.99);

const packageServiceBodySchema = z.object({
  quantity: z.coerce.number().int().min(1).max(50).optional().default(1),
  serviceId: idSchema,
  sortOrder: z.coerce.number().int().min(0).max(100000).optional().default(0),
});

/**
 * Shared admin package payload fields.
 */
const packageBodySchema = z.object({
  advanceAmount: moneySchema.nullable().optional(),
  branchId: idSchema,
  categoryId: optionalIdSchema,
  descriptionEn: z.string().trim().max(2000).nullable().optional(),
  descriptionHi: z.string().trim().max(2000).nullable().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(1440).nullable().optional(),
  imageUrl: z.string().trim().url().max(2048).nullable().optional(),
  isActive: z.boolean().optional(),
  isCustom: z.boolean().optional(),
  nameEn: z.string().trim().max(200).nullable().optional(),
  nameHi: z.string().trim().min(2).max(200),
  price: moneySchema,
  services: z.array(packageServiceBodySchema).max(30).optional().default([]),
  slug: slugSchema,
});

/**
 * Query schema for GET /api/v1/packages.
 */
export const listPackagesQuerySchema = z
  .object({
    branchId: idSchema,
    categoryId: optionalIdSchema,
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
 * Query schema for GET /api/v1/packages/:packageId.
 */
export const getPackageQuerySchema = z.object({
  branchId: idSchema,
});

/**
 * Request schema for POST /api/v1/admin/packages.
 */
export const createPackageSchema = packageBodySchema;

/**
 * Request schema for PATCH /api/v1/admin/packages/:packageId.
 */
export const updatePackageSchema = packageBodySchema
  .omit({ services: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one package field to update.",
  });

/**
 * Request schema for POST /api/v1/admin/packages/:packageId/services.
 */
export const assignPackageServiceSchema = packageServiceBodySchema;

export type AssignPackageServiceInput = z.infer<
  typeof assignPackageServiceSchema
>;
export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type GetPackageQueryInput = z.infer<typeof getPackageQuerySchema>;
export type ListPackagesQueryInput = z.infer<typeof listPackagesQuerySchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
