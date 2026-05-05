import { ConsultationStatus } from "@prisma/client";
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by consultation endpoints.
 */
const idSchema = z.string().trim().cuid();

const optionalIdSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

/**
 * Validates preferred consultation dates passed as YYYY-MM-DD.
 */
const consultationDateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "Date must be in YYYY-MM-DD format.",
  })
  .refine(
    (value) => {
      const parsed = new Date(`${value}T00:00:00.000Z`);
      return (
        !Number.isNaN(parsed.getTime()) &&
        parsed.toISOString().slice(0, 10) === value
      );
    },
    { message: "Date must be valid." },
  );

/**
 * Validates preferred local consultation times.
 */
const consultationTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: "Time must be in HH:mm:ss format.",
  });

/**
 * Query schema for GET /api/v1/users/me/consultations.
 */
export const listMyConsultationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(ConsultationStatus).optional(),
});

/**
 * Query schema for GET /api/v1/admin/consultations.
 */
export const adminListConsultationsQuerySchema = z.object({
  branchId: optionalIdSchema,
  date: consultationDateSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(ConsultationStatus).optional(),
});

/**
 * Request schema for POST /api/v1/consultations.
 */
export const createConsultationSchema = z.object({
  branchId: idSchema,
  notes: z.string().trim().max(1000).nullable().optional(),
  packageId: optionalIdSchema,
  preferredDate: consultationDateSchema.optional(),
  preferredTime: consultationTimeSchema.optional(),
  staffId: optionalIdSchema,
});

/**
 * Request schema for PATCH /api/v1/admin/consultations/:consultationId.
 */
export const updateConsultationSchema = z
  .object({
    adminNotes: z.string().trim().max(1000).nullable().optional(),
    branchId: idSchema.optional(),
    packageId: optionalIdSchema,
    preferredDate: consultationDateSchema.optional(),
    preferredTime: consultationTimeSchema.optional(),
    staffId: optionalIdSchema,
    status: z.enum(ConsultationStatus).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one consultation field to update.",
  });

export type AdminListConsultationsQueryInput = z.infer<
  typeof adminListConsultationsQuerySchema
>;
export type CreateConsultationInput = z.infer<typeof createConsultationSchema>;
export type ListMyConsultationsQueryInput = z.infer<
  typeof listMyConsultationsQuerySchema
>;
export type UpdateConsultationInput = z.infer<
  typeof updateConsultationSchema
>;
