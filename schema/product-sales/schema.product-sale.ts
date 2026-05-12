import { ProductSaleStatus } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by product sale endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema: z.ZodType<string | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

/**
 * Validates money values accepted by product sale requests.
 */
const moneySchema = z.coerce.number().min(0).max(999999.99);

export const listProductSalesQuerySchema = z.object({
  branchId: optionalIdSchema,
  date: z.string().trim().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.nativeEnum(ProductSaleStatus).optional(),
  userId: optionalIdSchema,
});

export const createProductSaleSchema = z.object({
  branchId: idSchema,
  discountAmount: moneySchema.optional().default(0),
  items: z.array(z.object({
    productId: idSchema,
    quantity: z.coerce.number().int().min(1).max(1000),
  })).min(1).max(100),
  notes: z.string().trim().max(2000).nullable().optional(),
  userId: optionalIdSchema,
});

export const updateProductSaleSchema = z.object({
  notes: z.string().trim().max(2000).nullable().optional(),
  status: z.nativeEnum(ProductSaleStatus).optional(),
}).refine((value) => Object.keys(value).length > 0, {
  message: "Send at least one product sale field to update.",
});

export type CreateProductSaleInput = z.infer<typeof createProductSaleSchema>;
export type ListProductSalesQueryInput = z.infer<typeof listProductSalesQuerySchema>;
export type UpdateProductSaleInput = z.infer<typeof updateProductSaleSchema>;
