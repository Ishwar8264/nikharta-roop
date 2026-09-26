import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

const isoDateTime = z
  .string({ error: "Time must be a string" })
  .pipe(z.iso.datetime({ offset: true }));

/**
 * User list query.
 *
 * Why:
 * The `search` filter matches email or name — the two identifiers an admin
 * actually has in hand when looking up a customer. `role` narrows to a
 * platform tier; `includeDeleted` lets the admin see soft-deleted accounts
 * for abuse investigations without polluting the default view.
 */
export const listUsersQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit must be at most 100")
    .default(50),
  search: z
    .string({ error: "Search must be a string" })
    .trim()
    .min(2, "Search must contain at least 2 characters")
    .max(120, "Search must contain at most 120 characters")
    .optional(),
  role: z
    .enum(["SUPER_ADMIN", "USER"], { error: "Role is invalid" })
    .optional(),
  includeDeleted: z
    .enum(["true", "false"], {
      error: "includeDeleted must be 'true' or 'false'",
    })
    .transform((v) => v === "true")
    .optional(),
});

/** Role change body. */
export const updateUserRoleSchema = z.strictObject({
  role: z.enum(["SUPER_ADMIN", "USER"], { error: "Role is invalid" }),
});

/**
 * AI block body.
 *
 * Why:
 * `reason` is required when `isBlocked` is true so the audit trail always
 * explains why a user was cut off. When unblocking, the reason is dropped
 * to avoid stale text confusing later readers.
 */
export const updateAiBlockSchema = z
  .strictObject({
    isBlocked: z.boolean({ error: "isBlocked must be a boolean" }),
    reason: z
      .string({ error: "Reason must be a string" })
      .trim()
      .min(3, "Reason must contain at least 3 characters")
      .max(500, "Reason must contain at most 500 characters")
      .optional(),
  })
  .refine((input) => !input.isBlocked || Boolean(input.reason), {
    message: "Reason is required when blocking a user",
    path: ["reason"],
  });

/**
 * Quota update body.
 *
 * Why:
 * All three limits are optional so the admin can tune just one window
 * without accidentally resetting the others. Each must be a non-negative
 * integer; the service layer additionally verifies that no new limit falls
 * below the amount already consumed in that window.
 */
export const updateAiQuotaSchema = z
  .strictObject({
    dailyLimit: z
      .number({ error: "Daily limit must be a number" })
      .int("Daily limit must be an integer")
      .min(0, "Daily limit cannot be negative")
      .max(10_000_000, "Daily limit is too large")
      .optional(),
    weeklyLimit: z
      .number({ error: "Weekly limit must be a number" })
      .int("Weekly limit must be an integer")
      .min(0, "Weekly limit cannot be negative")
      .max(100_000_000, "Weekly limit is too large")
      .optional(),
    monthlyLimit: z
      .number({ error: "Monthly limit must be a number" })
      .int("Monthly limit must be an integer")
      .min(0, "Monthly limit cannot be negative")
      .max(1_000_000_000, "Monthly limit is too large")
      .optional(),
  })
  .refine(
    (input) =>
      input.dailyLimit !== undefined ||
      input.weeklyLimit !== undefined ||
      input.monthlyLimit !== undefined,
    { message: "At least one limit must be provided" },
  );

/** AI usage log list query. */
export const listAiUsageQuerySchema = z.strictObject({
  cursor: z
    .string({ error: "Cursor must be a string" })
    .pipe(resourceIdSchema)
    .optional(),
  limit: z.coerce
    .number({ error: "Limit must be a number" })
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(200, "Limit must be at most 200")
    .default(50),
  userId: resourceIdSchema.optional(),
  model: z
    .string({ error: "Model must be a string" })
    .trim()
    .min(1, "Model must not be empty")
    .max(64, "Model must contain at most 64 characters")
    .optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
});

/** Aggregated stats query. */
export const aiUsageStatsQuerySchema = z.strictObject({
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  groupBy: z
    .enum(["model", "day", "user"], { error: "groupBy is invalid" })
    .default("model"),
});

/** URL params for the user-scoped routes. */
export const adminUserParamSchema = z.strictObject({
  userId: resourceIdSchema,
});
