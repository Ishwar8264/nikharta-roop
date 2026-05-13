import { InventoryTransactionType } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by inventory endpoints.
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

const booleanQuerySchema: z.ZodType<boolean | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => {
    if (value === "true") return true;
    if (value === "false") return false;
    return value;
  },
  z.boolean().optional(),
);

/**
 * Validates decimal quantities and costs used by inventory rows.
 */
const quantitySchema = z.coerce.number().min(-999999).max(999999);
const positiveQuantitySchema = z.coerce.number().min(0).max(999999);
const costSchema = z.coerce.number().min(0).max(999999.99);

export const listInventoryQuerySchema = z.object({
  branchId: optionalIdSchema,
  isActive: booleanQuerySchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  productId: optionalIdSchema,
});

export const listInventoryTransactionsQuerySchema = z.object({
  branchId: optionalIdSchema,
  inventoryItemId: optionalIdSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  type: z.nativeEnum(InventoryTransactionType).optional(),
});

const inventoryBodySchema = z.object({
  branchId: idSchema,
  costPerUnit: costSchema.nullable().optional(),
  isActive: z.boolean().optional(),
  nameEn: z.string().trim().max(200).nullable().optional(),
  nameHi: z.string().trim().min(2).max(200),
  productId: relationIdSchema,
  quantityOnHand: positiveQuantitySchema.optional(),
  reorderLevel: positiveQuantitySchema.nullable().optional(),
  sku: z.string().trim().max(80).nullable().optional(),
  unit: z.string().trim().min(1).max(40).optional(),
});

export const createInventorySchema = inventoryBodySchema;
export const updateInventorySchema = inventoryBodySchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  { message: "Send at least one inventory field to update." },
);

export const adjustInventorySchema = z.object({
  notes: z.string().trim().max(2000).nullable().optional(),
  quantityChange: quantitySchema.refine((value) => value !== 0, {
    message: "Quantity change cannot be zero.",
  }),
  type: z
    .nativeEnum(InventoryTransactionType)
    .default(InventoryTransactionType.ADJUSTMENT),
  unitCost: costSchema.nullable().optional(),
});

export type AdjustInventoryInput = Omit<
  z.infer<typeof adjustInventorySchema>,
  "type"
> & {
  type: InventoryTransactionType;
};
export type CreateInventoryInput = z.infer<typeof createInventorySchema>;
export type ListInventoryQueryInput = Omit<
  z.infer<typeof listInventoryQuerySchema>,
  "limit"
> & {
  limit: number;
};
export type ListInventoryTransactionsQueryInput = Omit<
  z.infer<typeof listInventoryTransactionsQuerySchema>,
  "limit"
> & {
  limit: number;
};
export type UpdateInventoryInput = z.infer<typeof updateInventorySchema>;
