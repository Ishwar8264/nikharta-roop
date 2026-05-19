/**
 * Purpose: Staff API validation schemas and inferred request types.
 * Responsibilities: normalize public/admin staff queries, create payloads, assignments, and leave records.
 * Important notes: time fields accept HH:mm or HH:mm:ss because browser time inputs submit HH:mm.
 */
import { z } from "zod";

/**
 * Validates CUID identifiers accepted by staff endpoints.
 */
const idSchema = z.string().trim().cuid();

/**
 * Allows optional CUID fields to be omitted or sent as an empty string.
 */
const optionalIdSchema: z.ZodType<string | undefined, z.ZodTypeDef, unknown> = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

/**
 * Validates HH:mm or HH:mm:ss local staff working times.
 */
const timeSchema = z.string().trim().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/);

/**
 * Validates a staff work-day JSON array.
 */
const workDaysSchema = z.array(z.number().int().min(0).max(6)).max(7).optional();

/**
 * Query schema for GET /api/v1/staff.
 */
export const listStaffQuerySchema = z.object({
  branchId: idSchema,
  serviceId: optionalIdSchema,
});

/**
 * Query schema for GET /api/v1/admin/staff.
 */
export const listAdminStaffQuerySchema = z.object({
  branchId: optionalIdSchema,
  limit: z.coerce.number().int().min(1).max(100).default(50),
  serviceId: optionalIdSchema,
  status: z.enum(["available", "unavailable", "all"]).default("all"),
});

/**
 * Query schema for GET /api/v1/staff/:staffId.
 */
export const getStaffQuerySchema = z.object({
  branchId: idSchema,
});

/**
 * Request schema for POST /api/v1/admin/staff.
 */
export const createStaffSchema = z.object({
  bioEn: z.string().trim().max(2000).nullable().optional(),
  bioHi: z.string().trim().max(2000).nullable().optional(),
  branchId: idSchema,
  experienceYears: z.coerce.number().int().min(0).max(80).nullable().optional(),
  isAvailable: z.boolean().optional(),
  photoUrl: z.string().trim().url().max(2048).nullable().optional(),
  serviceIds: z.array(idSchema).max(50).optional().default([]),
  specialization: z.array(z.string().trim().min(1).max(80)).max(20).optional(),
  userId: idSchema,
  workDays: workDaysSchema,
  workEnd: timeSchema,
  workStart: timeSchema,
});

/**
 * Request schema for PATCH /api/v1/admin/staff/:staffId.
 */
export const updateStaffSchema = createStaffSchema
  .omit({ serviceIds: true, userId: true })
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one staff field to update.",
  });

/**
 * Request schema for POST /api/v1/admin/staff/:staffId/services.
 */
export const assignStaffServiceSchema = z.object({
  serviceId: idSchema,
});

/**
 * Shared staff leave date fields.
 */
const staffLeaveBodySchema = z.object({
  endsAt: z.coerce.date(),
  reason: z.string().trim().max(300).nullable().optional(),
  startsAt: z.coerce.date(),
});

/**
 * Request schema for POST /api/v1/admin/staff/:staffId/leaves.
 */
export const createStaffLeaveSchema = staffLeaveBodySchema.refine((value) => value.startsAt < value.endsAt, {
  message: "Leave start must be before leave end.",
});

/**
 * Request schema for PATCH /api/v1/admin/staff/:staffId/leaves/:leaveId.
 */
export const updateStaffLeaveSchema = staffLeaveBodySchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, {
    message: "Send at least one leave field to update.",
  })
  .refine(
    (value) =>
      !value.startsAt || !value.endsAt || value.startsAt < value.endsAt,
    { message: "Leave start must be before leave end." },
  );

export type AssignStaffServiceInput = z.infer<typeof assignStaffServiceSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type CreateStaffLeaveInput = z.infer<typeof createStaffLeaveSchema>;
export type GetStaffQueryInput = z.infer<typeof getStaffQuerySchema>;
export type ListAdminStaffQueryInput = z.infer<typeof listAdminStaffQuerySchema>;
export type ListStaffQueryInput = z.infer<typeof listStaffQuerySchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type UpdateStaffLeaveInput = z.infer<typeof updateStaffLeaveSchema>;
