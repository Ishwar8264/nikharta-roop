import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

/**
 * Query for the caller's own notification inbox.
 *
 * Why:
 * Filtering by channel and unread state covers the two common UI screens
 * (bell popover and full inbox). The list is scoped to the authenticated
 * user, so no target filter is needed.
 */
export const listNotificationsQuerySchema = z.strictObject({
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
  channel: z
    .enum(["EMAIL", "SMS", "WHATSAPP", "PUSH", "IN_APP"], {
      error: "Channel is invalid",
    })
    .optional(),
  unreadOnly: z
    .enum(["true", "false"], {
      error: "unreadOnly must be 'true' or 'false'",
    })
    .transform((v) => v === "true")
    .optional(),
});

/** URL params for the notification detail route. */
export const notificationParamSchema = z.strictObject({
  notificationId: resourceIdSchema,
});
