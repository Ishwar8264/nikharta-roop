import { z } from "zod";

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

const daySchema = z.strictObject({
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
  openTime: z
    .string({ error: "Open time must be a string" })
    .regex(timePattern, "Open time must be HH:mm")
    .optional(),
  closeTime: z
    .string({ error: "Close time must be a string" })
    .regex(timePattern, "Close time must be HH:mm")
    .optional(),
  isClosed: z
    .boolean({ error: "Closed flag must be a boolean" })
    .default(false),
});

/**
 * Bulk working-hours replacement body.
 *
 * Why:
 * The weekly schedule is exactly 7 rows. Sending them as one PUT keeps the
 * client simple and lets the server enforce the "closeTime > openTime"
 * invariant across the full set inside a single transaction.
 */
export const replaceWorkingHoursSchema = z
  .strictObject({
    days: z
      .array(daySchema, { error: "Days must be an array" })
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
        if (day.isClosed) return true;
        return Boolean(day.openTime && day.closeTime);
      }),
    { message: "openTime and closeTime are required when isClosed is false" },
  )
  .refine(
    (input) =>
      input.days.every((day) => {
        if (day.isClosed || !day.openTime || !day.closeTime) return true;
        return day.openTime < day.closeTime;
      }),
    { message: "closeTime must be later than openTime" },
  );
