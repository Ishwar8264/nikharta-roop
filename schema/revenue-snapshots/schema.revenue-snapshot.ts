import { z } from "zod";

/**
 * Validates CUID identifiers accepted by revenue snapshot endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema: z.ZodType<string | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

const countSchema = z.coerce.number().int().min(0).max(999999);
const moneySchema = z.coerce.number().min(0).max(999999999.99);

export const listRevenueSnapshotsQuerySchema = z.object({
  branchId: optionalIdSchema,
  from: z.string().trim().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  to: z.string().trim().date().optional(),
});

const revenueSnapshotBodySchema = z.object({
  advanceRevenue: moneySchema.optional(),
  bookingCount: countSchema.optional(),
  branchId: idSchema,
  cancelledCount: countSchema.optional(),
  completedCount: countSchema.optional(),
  date: z.string().trim().date(),
  discountTotal: moneySchema.optional(),
  grossRevenue: moneySchema.optional(),
});

export const createRevenueSnapshotSchema = revenueSnapshotBodySchema;
export const updateRevenueSnapshotSchema = revenueSnapshotBodySchema
  .omit({ branchId: true, date: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one revenue snapshot field to update.",
  });

export type CreateRevenueSnapshotInput = z.infer<typeof createRevenueSnapshotSchema>;
export type ListRevenueSnapshotsQueryInput = z.infer<
  typeof listRevenueSnapshotsQuerySchema
>;
export type UpdateRevenueSnapshotInput = z.infer<typeof updateRevenueSnapshotSchema>;
