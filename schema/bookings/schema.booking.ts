import { z } from "zod";

import { BookingStatus } from "@prisma/client";

/**
 * Validates CUID identifiers accepted by booking endpoints.
 */
const idSchema = z.string().trim().cuid();

/**
 * Allows optional CUID fields to be omitted or sent as an empty string.
 */
const optionalIdSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  idSchema.optional(),
);

/**
 * Validates local booking dates passed as YYYY-MM-DD.
 */
const bookingDateSchema = z
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
    {
      message: "Date must be valid.",
    },
  );

/**
 * Validates slot times in HH:mm:ss shape and 30-minute grid alignment.
 */
const slotTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: "Slot time must be in HH:mm:ss format.",
  })
  .refine(
    (value) => {
      const [, minutes = "0", seconds = "0"] = value.split(":");

      return Number(minutes) % 30 === 0 && Number(seconds) === 0;
    },
    {
      message: "Slot time must use a 30-minute grid.",
    },
  );

/**
 * Validates one requested booking add-on row.
 */
const bookingAddOnInputSchema = z.object({
  addOnId: idSchema,
  quantity: z.number().int().min(1).max(10).optional(),
});

/**
 * Query schema for GET /api/v1/bookings/slots.
 */
export const listBookingSlotsQuerySchema = z.object({
  branchId: idSchema,
  date: bookingDateSchema,
  serviceId: idSchema,
  serviceVariantId: optionalIdSchema,
  staffId: optionalIdSchema,
});

export type ListBookingSlotsQueryInput = z.infer<
  typeof listBookingSlotsQuerySchema
>;

/**
 * Query schema for GET /api/v1/bookings.
 */
export const listBookingsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  status: z.enum(BookingStatus).optional(),
});

export type ListBookingsQueryInput = z.infer<typeof listBookingsQuerySchema>;

/**
 * Query schema for GET /api/v1/admin/bookings.
 */
export const adminListBookingsQuerySchema = z.object({
  branchId: optionalIdSchema,
  date: bookingDateSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  status: z.enum(BookingStatus).optional(),
});

export type AdminListBookingsQueryInput = z.infer<
  typeof adminListBookingsQuerySchema
>;

/**
 * Request schema for POST /api/v1/bookings.
 */
export const createBookingSchema = z.object({
  addOns: z.array(bookingAddOnInputSchema).max(10).optional().default([]),
  bookingDate: bookingDateSchema,
  branchId: idSchema,
  notes: z.string().trim().max(500).nullable().optional(),
  serviceId: idSchema,
  serviceVariantId: optionalIdSchema,
  slotStart: slotTimeSchema,
  staffId: optionalIdSchema,
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

/**
 * Request schema for PATCH /api/v1/bookings/:bookingId/cancel.
 */
export const cancelBookingSchema = z.preprocess(
  (value) => value ?? {},
  z.object({
    reason: z.string().trim().max(300).nullable().optional(),
  }),
);

export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;

/**
 * Request schema for PATCH /api/v1/bookings/:bookingId/reschedule.
 */
export const rescheduleBookingSchema = z.object({
  bookingDate: bookingDateSchema,
  slotStart: slotTimeSchema,
  staffId: optionalIdSchema,
});

export type RescheduleBookingInput = z.infer<typeof rescheduleBookingSchema>;

/**
 * Request schema for admin booking cancellation.
 */
export const adminCancelBookingSchema = cancelBookingSchema;

export type AdminCancelBookingInput = z.infer<typeof adminCancelBookingSchema>;

/**
 * Request schema for PATCH /api/v1/admin/bookings/:bookingId/assign-staff.
 */
export const adminAssignStaffSchema = z.object({
  staffId: idSchema,
});

export type AdminAssignStaffInput = z.infer<typeof adminAssignStaffSchema>;
