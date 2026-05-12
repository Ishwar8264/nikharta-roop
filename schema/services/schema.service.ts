import { z } from "zod";

/**
 * Validates CUID identifiers accepted by service discovery endpoints.
 */
const idSchema = z.string().trim().cuid();

/**
 * Allows optional CUID fields to be omitted or sent as an empty string.
 */
const optionalIdSchema: z.ZodType<string | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

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
 * Validates positive money amounts sent by admin service forms.
 */
const moneySchema = z.coerce.number().min(0).max(999999.99);

/**
 * Shared admin category payload fields.
 */
const serviceCategoryBodySchema = z.object({
  branchId: optionalIdSchema,
  description: z.string().trim().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
  nameEn: z.string().trim().min(2).max(200),
  nameHi: z.string().trim().min(2).max(200),
  slug: slugSchema,
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});

/**
 * Shared admin service payload fields.
 */
const serviceBodySchema = z.object({
  advanceAmount: moneySchema.nullable().optional(),
  branchId: idSchema,
  categoryId: idSchema,
  descriptionEn: z.string().trim().max(2000).nullable().optional(),
  descriptionHi: z.string().trim().min(2).max(2000),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  galleryUrls: z.array(z.string().trim().url().max(2048)).max(12).optional(),
  imageUrl: z.string().trim().url().max(2048).nullable().optional(),
  isActive: z.boolean().optional(),
  nameEn: z.string().trim().min(2).max(200),
  nameHi: z.string().trim().min(2).max(200),
  price: moneySchema,
  slug: slugSchema,
});

/**
 * Shared admin variant payload fields.
 */
const serviceVariantBodySchema = z.object({
  advanceAmount: moneySchema.nullable().optional(),
  descriptionHi: z.string().trim().max(1000).nullable().optional(),
  durationMinutes: z.coerce.number().int().min(5).max(480),
  isActive: z.boolean().optional(),
  nameEn: z.string().trim().max(200).nullable().optional(),
  nameHi: z.string().trim().min(2).max(200),
  price: moneySchema,
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
});

/**
 * Shared admin add-on payload fields.
 */
const serviceAddOnBodySchema = z.object({
  descriptionHi: z.string().trim().max(1000).nullable().optional(),
  durationMinutes: z.coerce.number().int().min(0).max(240).optional(),
  isActive: z.boolean().optional(),
  nameEn: z.string().trim().max(200).nullable().optional(),
  nameHi: z.string().trim().min(2).max(200),
  price: moneySchema,
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

/**
 * Request schema for POST /api/v1/admin/services/categories.
 */
export const createServiceCategorySchema = serviceCategoryBodySchema;

/**
 * Request schema for PATCH /api/v1/admin/services/categories/:categoryId.
 */
export const updateServiceCategorySchema = serviceCategoryBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one category field to update.",
  });

/**
 * Request schema for POST /api/v1/admin/services.
 */
export const createServiceSchema = serviceBodySchema;

/**
 * Request schema for PATCH /api/v1/admin/services/:serviceId.
 */
export const updateServiceSchema = serviceBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one service field to update.",
  });

/**
 * Request schema for POST /api/v1/admin/services/:serviceId/variants.
 */
export const createServiceVariantSchema = serviceVariantBodySchema;

/**
 * Request schema for PATCH /api/v1/admin/services/:serviceId/variants/:variantId.
 */
export const updateServiceVariantSchema = serviceVariantBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one variant field to update.",
  });

/**
 * Request schema for POST /api/v1/admin/services/:serviceId/add-ons.
 */
export const createServiceAddOnSchema = serviceAddOnBodySchema;

/**
 * Request schema for PATCH /api/v1/admin/services/:serviceId/add-ons/:addOnId.
 */
export const updateServiceAddOnSchema = serviceAddOnBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one add-on field to update.",
  });

export type GetServiceQueryInput = z.infer<typeof getServiceQuerySchema>;
export type ListServiceCategoriesQueryInput = z.infer<
  typeof listServiceCategoriesQuerySchema
>;
export type ListServicesQueryInput = z.infer<typeof listServicesQuerySchema>;
export type CreateServiceAddOnInput = z.infer<typeof createServiceAddOnSchema>;
export type CreateServiceCategoryInput = z.infer<
  typeof createServiceCategorySchema
>;
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type CreateServiceVariantInput = z.infer<
  typeof createServiceVariantSchema
>;
export type UpdateServiceAddOnInput = z.infer<typeof updateServiceAddOnSchema>;
export type UpdateServiceCategoryInput = z.infer<
  typeof updateServiceCategorySchema
>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type UpdateServiceVariantInput = z.infer<
  typeof updateServiceVariantSchema
>;
