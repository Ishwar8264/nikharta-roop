import { PaymentProvider, PaymentStatus } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by admin payment endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema = z
  .union([idSchema, z.literal("")])
  .optional()
  .transform((value) => value || undefined);

export const listAdminPaymentsQuerySchema = z.object({
  bookingId: optionalIdSchema,
  branchId: optionalIdSchema,
  from: z.string().trim().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  provider: z.nativeEnum(PaymentProvider).optional(),
  status: z.nativeEnum(PaymentStatus).optional(),
  to: z.string().trim().date().optional(),
  userId: optionalIdSchema,
});

export type ListAdminPaymentsQueryInput = z.infer<
  typeof listAdminPaymentsQuerySchema
>;
