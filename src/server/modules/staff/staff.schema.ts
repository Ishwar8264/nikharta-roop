import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

/**
 * Global list query — filtered by salon role.
 *
 * Why:
 * The same endpoint serves "all members" and "only bookable staff" callers by
 * letting the client narrow the role. Absent filter returns every member.
 */
export const listStaffQuerySchema = z.strictObject({
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
  role: z
    .enum(["OWNER", "MANAGER", "STAFF"], { error: "Role is invalid" })
    .optional(),
});

/**
 * A single day of a staff member's weekly schedule.
 *
 * Why:
 * Times are HH:mm strings in the salon's local timezone. The service layer
 * validates that `closeTime` > `openTime` when `isOff` is false; the Zod
 * shape only enforces format so both fields can be omitted when `isOff` is
 * true.
 */
const scheduleDaySchema = z.strictObject({
  day: z.enum(
    [
      "MONDAY",
      "TUESDAY",
      "WEDNESDAY",
      "THURSDAY",
      "FRIDAY",
      "SATURDAY",
      "SUNDAY",
    ],
    { error: "Day is invalid" },
  ),
  startTime: z
    .string({ error: "Start time must be a string" })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Start time must be HH:mm")
    .optional(),
  endTime: z
    .string({ error: "End time must be a string" })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "End time must be HH:mm")
    .optional(),
  isOff: z.boolean({ error: "Off flag must be a boolean" }).default(false),
});

/**
 * Bulk schedule replacement body.
 *
 * Why:
 * The weekly schedule is exactly 7 rows. Sending them as one PUT keeps the
 * client simple and lets the server enforce the "closeTime > startTime"
 * invariant across the full set in one transaction.
 */
export const replaceScheduleSchema = z
  .strictObject({
    days: z
      .array(scheduleDaySchema, { error: "Days must be an array" })
      .length(7, "Exactly 7 days are required"),
  })
  .refine(
    (input) => {
      const seen = new Set<string>();
      for (const day of input.days) {
        if (seen.has(day.day)) return false;
        seen.add(day.day);
      }
      return true;
    },
    { message: "Each day may appear at most once" },
  )
  .refine(
    (input) =>
      input.days.every((day) => {
        if (day.isOff) return true;
        return Boolean(day.startTime && day.endTime);
      }),
    {
      message: "startTime and endTime are required when isOff is false",
    },
  )
  .refine(
    (input) =>
      input.days.every((day) => {
        if (day.isOff || !day.startTime || !day.endTime) return true;
        return day.startTime < day.endTime;
      }),
    { message: "endTime must be later than startTime" },
  );

/**
 * Leave creation body.
 *
 * Why:
 * `startDate` and `endDate` are ISO datetimes in the salon's timezone. The
 * service layer verifies the range is ordered and does not overlap an
 * existing leave; Zod only validates the shape.
 */
export const createLeaveSchema = z
  .strictObject({
    startDate: z
      .string({ error: "Start date must be a string" })
      .pipe(z.iso.datetime({ offset: true })),
    endDate: z
      .string({ error: "End date must be a string" })
      .pipe(z.iso.datetime({ offset: true })),
    reason: z
      .string({ error: "Reason must be a string" })
      .trim()
      .max(500, "Reason must contain at most 500 characters")
      .optional(),
  })
  .refine((input) => new Date(input.startDate) < new Date(input.endDate), {
    message: "endDate must be later than startDate",
    path: ["endDate"],
  });

/** Partial update for a leave — only approval state is editable. */
export const updateLeaveSchema = z.strictObject({
  approved: z.boolean({ error: "Approved must be a boolean" }),
});

/** Body for bulk-replacing staff skills. */
export const replaceSkillsSchema = z.strictObject({
  skills: z
    .array(
      z.strictObject({
        serviceId: resourceIdSchema,
        experience: z
          .number({ error: "Experience must be a number" })
          .int("Experience must be an integer")
          .min(0, "Experience cannot be negative")
          .max(80, "Experience is too large")
          .optional(),
      }),
      { error: "Skills must be an array" },
    )
    .max(100, "At most 100 skills are allowed")
    .refine(
      (skills) =>
        new Set(skills.map((skill) => skill.serviceId)).size === skills.length,
      "Each service may appear at most once",
    ),
});

/** URL params for the staff detail and sub-resource routes. */
export const staffParamSchema = z.strictObject({
  salonRef: z
    .string({ error: "Salon reference must be a string" })
    .trim()
    .min(2, "Salon reference must contain at least 2 characters")
    .max(80, "Salon reference must contain at most 80 characters"),
  staffId: resourceIdSchema,
});

/** URL params for the leave detail route. */
export const staffLeaveParamSchema = z.strictObject({
  salonRef: z
    .string({ error: "Salon reference must be a string" })
    .trim()
    .min(2, "Salon reference must contain at least 2 characters")
    .max(80, "Salon reference must contain at most 80 characters"),
  staffId: resourceIdSchema,
  leaveId: resourceIdSchema,
});

/** URL params for the service-scoped staff listing route. */
export const serviceStaffParamSchema = z.strictObject({
  salonRef: z
    .string({ error: "Salon reference must be a string" })
    .trim()
    .min(2, "Salon reference must contain at least 2 characters")
    .max(80, "Salon reference must contain at most 80 characters"),
  serviceRef: z
    .string({ error: "Service reference must be a string" })
    .trim()
    .min(2, "Service reference must contain at least 2 characters")
    .max(80, "Service reference must contain at most 80 characters"),
});
