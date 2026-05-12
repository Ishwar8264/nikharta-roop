import { StaffCommissionStatus } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by staff commission endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema: z.ZodType<string | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

/**
 * Validates decimal money values accepted by commission writes.
 */
const moneySchema = z.coerce.number().min(0).max(999999.99);

export const listStaffCommissionsQuerySchema = z.object({
  bookingId: optionalIdSchema,
  branchId: optionalIdSchema,
  from: z.string().trim().date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  productSaleId: optionalIdSchema,
  staffId: optionalIdSchema,
  status: z.nativeEnum(StaffCommissionStatus).optional(),
  to: z.string().trim().date().optional(),
});

const commissionBaseSchema = z.object({
  baseAmount: moneySchema,
  bookingId: optionalIdSchema,
  commissionAmount: moneySchema.optional(),
  commissionRate: z.coerce.number().min(0).max(100).nullable().optional(),
  paidAt: z.coerce.date().nullable().optional(),
  productSaleId: optionalIdSchema,
  staffId: idSchema,
  status: z.nativeEnum(StaffCommissionStatus).optional(),
});

export const createStaffCommissionSchema = commissionBaseSchema
  .refine((value) => !(value.bookingId && value.productSaleId), {
    message: "Use either bookingId or productSaleId, not both.",
  })
  .refine((value) => value.commissionAmount !== undefined || value.commissionRate != null, {
    message: "Send commissionAmount or commissionRate.",
  });

export const updateStaffCommissionSchema = commissionBaseSchema
  .omit({ bookingId: true, productSaleId: true, staffId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one commission field to update.",
  });

export type CreateStaffCommissionInput = z.infer<typeof createStaffCommissionSchema>;
export type ListStaffCommissionsQueryInput = z.infer<
  typeof listStaffCommissionsQuerySchema
>;
export type UpdateStaffCommissionInput = z.infer<typeof updateStaffCommissionSchema>;
