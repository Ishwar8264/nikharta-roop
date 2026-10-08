import { z } from "zod";

/**
 * Salon booking rules patch — every field optional, at least one required.
 *
 * Why a settings row instead of columns on Salon:
 * New rules land as new columns here, and the per-salon defaults stay
 * explicit, so future features never need a Salon-table migration.
 */
export const updateSalonSettingsSchema = z
  .strictObject({
    bufferMinutes: z
      .number({ error: "Buffer must be a number" })
      .int("Buffer must be an integer")
      .min(0, "Buffer cannot be negative")
      .max(120, "Buffer must be at most 120 minutes")
      .optional(),
    advanceBookingDays: z
      .number({ error: "Advance booking days must be a number" })
      .int("Advance booking days must be an integer")
      .min(1, "Advance booking days must be at least 1")
      .max(365, "Advance booking days must be at most 365")
      .optional(),
    cancellationWindowHours: z
      .number({ error: "Cancellation window must be a number" })
      .int("Cancellation window must be an integer")
      .min(0, "Cancellation window cannot be negative")
      .max(168, "Cancellation window must be at most 168 hours")
      .optional(),
    noShowFee: z
      .number({ error: "No-show fee must be a number" })
      .nonnegative("No-show fee cannot be negative")
      .max(10_000_000, "No-show fee is too large")
      .nullable()
      .optional(),
    acceptsAdvancePayments: z
      .boolean({ error: "Advance payments flag must be a boolean" })
      .optional(),
    walkInsAllowed: z
      .boolean({ error: "Walk-ins flag must be a boolean" })
      .optional(),
  })
  .refine((input) => Object.values(input).some((value) => value !== undefined), {
    message: "At least one field must be provided",
  });
