import { RefundStatus } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by refund admin endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

export const listRefundsQuerySchema = z.object({
  bookingId: optionalIdSchema,
  branchId: optionalIdSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  paymentId: optionalIdSchema,
  status: z.enum(RefundStatus).optional(),
});

export const updateRefundSchema = z
  .object({
    processedAt: z.coerce.date().nullable().optional(),
    providerRefundId: z.string().trim().min(3).max(120).nullable().optional(),
    reasonHi: z.string().trim().max(300).nullable().optional(),
    status: z.enum(RefundStatus).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one refund field to update.",
  });

export type ListRefundsQueryInput = z.infer<typeof listRefundsQuerySchema>;
export type UpdateRefundInput = z.infer<typeof updateRefundSchema>;
