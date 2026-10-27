import { z } from "zod";

/**
 * Form validation for salon settings. Unlike the API PATCH schema, the form
 * allows an empty draft; its caller disables Save until a field changes.
 */
export const settingsFormSchema = z.object({
  bufferMinutes: z
    .number({ error: "Buffer must be a number" })
    .int("Buffer must be an integer")
    .min(0, "Buffer cannot be negative")
    .max(120, "Buffer must be at most 120 minutes"),
  advanceBookingDays: z
    .number({ error: "Advance booking days must be a number" })
    .int("Advance booking days must be an integer")
    .min(1, "Advance booking days must be at least 1")
    .max(365, "Advance booking days must be at most 365"),
  cancellationWindowHours: z
    .number({ error: "Cancellation window must be a number" })
    .int("Cancellation window must be an integer")
    .min(0, "Cancellation window cannot be negative")
    .max(168, "Cancellation window must be at most 168 hours"),
  noShowFee: z
    .number({ error: "No-show fee must be a number" })
    .nonnegative("No-show fee cannot be negative")
    .max(10_000_000, "No-show fee is too large")
    .nullable(),
  acceptsAdvancePayments: z.boolean({
    error: "Advance payments flag must be a boolean",
  }),
  walkInsAllowed: z.boolean({ error: "Walk-ins flag must be a boolean" }),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;
