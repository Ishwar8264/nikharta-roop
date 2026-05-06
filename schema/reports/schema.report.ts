import { z } from "zod";

/**
 * Validates CUID identifiers accepted by report endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

/**
 * Shared query schema for admin report endpoints.
 */
export const reportQuerySchema = z.object({
  branchId: optionalIdSchema,
  from: z.string().trim().date().optional(),
  to: z.string().trim().date().optional(),
});

export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
