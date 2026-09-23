import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

const isoDateTime = z
  .string({ error: "Time must be a string" })
  .pipe(z.iso.datetime({ offset: true }));

/**
 * Service booking line item.
 *
 * Why:
 * Each requested service can optionally be assigned to a specific staff
 * member. When omitted, the appointment's primary `staffId` is used for all
 * services — a common case for short appointments.
 */
const serviceLineSchema = z.strictObject({
  serviceId: resourceIdSchema,
  staffId: resourceIdSchema.optional(),
});

/**
 * Appointment creation body.
 *
 * Why:
 * The client sends the desired start time as an ISO datetime with offset.
 * The server derives `endTime` from the sum of service durations, so the
 * client cannot manipulate the booked window.
 */
export const createAppointmentSchema = z
  .strictObject({
    salonRef: z
      .string({ error: "Salon reference must be a string" })
      .trim()
      .min(2, "Salon reference must contain at least 2 characters")
      .max(80, "Salon reference must contain at most 80 characters"),
    customerId: resourceIdSchema.optional(),
    staffId: resourceIdSchema.optional(),
    startTime: isoDateTime,
    services: z
      .array(serviceLineSchema, { error: "Services must be an array" })
      .min(1, "At least one service is required")
      .max(20, "At most 20 services are allowed"),
    notes: z
      .string({ error: "Notes must be a string" })
      .trim()
      .max(2000, "Notes must contain at most 2000 characters")
      .optional(),
  })
  .refine(
    (input) =>
      new Set(input.services.map((service) => service.serviceId)).size ===
      input.services.length,
    { message: "Each service may appear at most once" },
  );

/** Customer appointment listing query. */
export const listMyAppointmentsQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(50, "Limit must be at most 50")
    .default(20),
  status: z
    .enum(
      [
        "SCHEDULED",
        "CONFIRMED",
        "IN_PROGRESS",
        "COMPLETED",
        "CANCELLED",
        "NO_SHOW",
        "RESCHEDULED",
      ],
      { error: "Status is invalid" },
    )
    .optional(),
  upcoming: z
    .enum(["true", "false"], { error: "upcoming must be 'true' or 'false'" })
    .transform((v) => v === "true")
    .optional(),
});

/** Salon appointment listing query. */
export const listSalonAppointmentsQuerySchema = z
  .strictObject({
    cursor: z
      .string({ error: "Cursor must be a string" })
      .pipe(resourceIdSchema)
      .optional(),
    limit: z.coerce
      .number({ error: "Limit must be a number" })
      .int("Limit must be an integer")
      .min(1, "Limit must be at least 1")
      .max(100, "Limit must be at most 100")
      .default(20),
    status: z
      .enum(
        [
          "SCHEDULED",
          "CONFIRMED",
          "IN_PROGRESS",
          "COMPLETED",
          "CANCELLED",
          "NO_SHOW",
          "RESCHEDULED",
        ],
        { error: "Status is invalid" },
      )
      .optional(),
    staffId: resourceIdSchema.optional(),
    from: isoDateTime.optional(),
    to: isoDateTime.optional(),
  })
  .refine(
    (input) =>
      !input.from ||
      !input.to ||
      Date.parse(input.from) <= Date.parse(input.to),
    { message: "To time must be later than or equal to from time" },
  );

/** Cancel body. */
export const cancelAppointmentSchema = z.strictObject({
  reason: z
    .string({ error: "Reason must be a string" })
    .trim()
    .min(2, "Reason must contain at least 2 characters")
    .max(500, "Reason must contain at most 500 characters"),
});

/** Reschedule body — same shape as create minus salon/services/notes. */
export const rescheduleAppointmentSchema = z.strictObject({
  startTime: isoDateTime,
  staffId: resourceIdSchema.optional(),
});

/** Status transition body. */
export const updateAppointmentStatusSchema = z.strictObject({
  status: z.enum(
    ["CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"],
    { error: "Target status is invalid" },
  ),
  reason: z
    .string({ error: "Reason must be a string" })
    .trim()
    .max(500, "Reason must contain at most 500 characters")
    .optional(),
});

/** Payment body for recording. */
export const createPaymentSchema = z.strictObject({
  amount: z
    .number({ error: "Amount must be a number" })
    .min(0, "Amount cannot be negative")
    .max(10_000_000, "Amount is too large"),
  method: z.enum(["CASH", "CARD", "UPI", "WALLET", "ONLINE"], {
    error: "Method is invalid",
  }),
  transactionId: z
    .string({ error: "Transaction ID must be a string" })
    .trim()
    .max(128, "Transaction ID is too long")
    .optional(),
  gatewayRef: z
    .string({ error: "Gateway reference must be a string" })
    .trim()
    .max(255, "Gateway reference is too long")
    .optional(),
});

/** Payment update body. */
export const updatePaymentSchema = z
  .strictObject({
    status: z
      .enum(["PENDING", "PAID", "PARTIALLY_PAID", "REFUNDED", "FAILED"], {
        error: "Status is invalid",
      })
      .optional(),
    refundAmount: z
      .number({ error: "Refund amount must be a number" })
      .min(0, "Refund amount cannot be negative")
      .max(10_000_000, "Refund amount is too large")
      .optional(),
    transactionId: z
      .string({ error: "Transaction ID must be a string" })
      .trim()
      .max(128, "Transaction ID is too long")
      .optional(),
    gatewayRef: z
      .string({ error: "Gateway reference must be a string" })
      .trim()
      .max(255, "Gateway reference is too long")
      .optional(),
  })
  .refine(
    (input) => Object.values(input).some((value) => value !== undefined),
    { message: "At least one field must be provided" },
  );

/** URL params for the appointment detail route. */
export const appointmentParamSchema = z.strictObject({
  appointmentId: resourceIdSchema,
});

/** Availability query — public. */
export const availabilityQuerySchema = z.strictObject({
  staffId: resourceIdSchema,
  serviceIds: z
    .string({ error: "Service IDs must be a comma-separated string" })
    .trim()
    .min(1, "At least one service ID is required")
    .transform((raw) =>
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
    .pipe(
      z
        .array(resourceIdSchema)
        .min(1, "At least one service ID is required")
        .max(10, "At most 10 services are allowed")
        .refine((ids) => new Set(ids).size === ids.length, {
          message: "Each service may appear at most once",
        }),
    ),
  date: z
    .string({ error: "Date must be a string" })
    .pipe(z.iso.date({ error: "Date must be YYYY-MM-DD" })),
});
