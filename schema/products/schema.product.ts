import { z } from "zod";

/**
 * Validates CUID identifiers accepted by product endpoints.
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

/**
 * Normalizes URL slugs used by public product routes.
 */
const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(220)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/**
 * Validates product prices stored by Prisma Decimal.
 */
const moneySchema = z.coerce.number().min(0).max(999999.99);

export const listProductCategoriesQuerySchema = z.object({
  branchId: optionalIdSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const listProductsQuerySchema = z.object({
  branchId: optionalIdSchema,
  categoryId: optionalIdSchema,
  categorySlug: z.string().trim().min(2).max(220).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const productCategoryBodySchema = z.object({
  branchId: relationIdSchema,
  description: z.string().trim().max(2000).nullable().optional(),
  isActive: z.boolean().optional(),
  nameEn: z.string().trim().max(200).nullable().optional(),
  nameHi: z.string().trim().min(2).max(200),
  slug: slugSchema,
});

const productBodySchema = z.object({
  branchId: idSchema,
  categoryId: relationIdSchema,
  descriptionHi: z.string().trim().max(2000).nullable().optional(),
  imageUrl: z.string().trim().url().max(1000).nullable().optional(),
  isActive: z.boolean().optional(),
  nameEn: z.string().trim().max(200).nullable().optional(),
  nameHi: z.string().trim().min(2).max(200),
  price: moneySchema,
  slug: slugSchema,
  stockQuantity: z.coerce.number().int().min(0).max(1000000).optional(),
});

export const createProductCategorySchema = productCategoryBodySchema;
export const updateProductCategorySchema = productCategoryBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Send at least one product category field to update." },
);
export const createProductSchema = productBodySchema;
export const updateProductSchema = productBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Send at least one product field to update." },
);

export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type ListProductCategoriesQueryInput = z.infer<typeof listProductCategoriesQuerySchema>;
export type ListProductsQueryInput = z.infer<typeof listProductsQuerySchema>;
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
