import { z } from "zod";

/**
 * Validates CUID identifiers accepted by portfolio endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema: z.ZodType<string | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

const relationIdSchema: z.ZodType<string | null | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.nullable().optional(),
);

const booleanQuerySchema: z.ZodType<boolean | undefined, z.ZodTypeDef, unknown> = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

/**
 * Validates image URLs stored against portfolio items.
 */
const imageUrlSchema = z.string().trim().url().max(1000);

/**
 * Query schema for GET /api/v1/portfolio.
 */
export const listPortfolioQuerySchema = z.object({
  branchId: optionalIdSchema,
  featured: booleanQuerySchema,
  limit: z.coerce.number().int().min(1).max(50).default(20),
  packageId: optionalIdSchema,
  serviceId: optionalIdSchema,
  staffId: optionalIdSchema,
});

/**
 * Query schema for GET /api/v1/admin/portfolio.
 */
export const adminListPortfolioQuerySchema = listPortfolioQuerySchema.extend({
  isPublished: booleanQuerySchema,
}).omit({ featured: true }).extend({
  isFeatured: booleanQuerySchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Shared portfolio body fields for create and patch requests.
 */
const portfolioBodySchema = z.object({
  afterImageUrl: imageUrlSchema.nullable().optional(),
  beforeImageUrl: imageUrlSchema.nullable().optional(),
  branchId: idSchema,
  descriptionHi: z.string().trim().max(2000).nullable().optional(),
  imageUrls: z.array(imageUrlSchema).max(20).optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  packageId: relationIdSchema,
  serviceId: relationIdSchema,
  sortOrder: z.coerce.number().int().min(0).max(100000).optional(),
  staffId: relationIdSchema,
  titleHi: z.string().trim().max(200).nullable().optional(),
});

/**
 * Request schema for POST /api/v1/admin/portfolio.
 */
export const createPortfolioSchema = portfolioBodySchema.extend({
  imageUrls: z.array(imageUrlSchema).max(20).optional().default([]),
});

/**
 * Request schema for PATCH /api/v1/admin/portfolio/:portfolioItemId.
 */
export const updatePortfolioSchema = portfolioBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Send at least one portfolio field to update." },
);

export type AdminListPortfolioQueryInput = z.infer<
  typeof adminListPortfolioQuerySchema
>;
export type CreatePortfolioInput = z.infer<typeof createPortfolioSchema>;
export type ListPortfolioQueryInput = z.infer<typeof listPortfolioQuerySchema>;
export type UpdatePortfolioInput = z.infer<typeof updatePortfolioSchema>;
