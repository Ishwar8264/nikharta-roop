import { z } from "zod";

import { resourceIdSchema } from "@/server/modules/salon/salon.schema";

const isoDateTime = z
  .string({ error: "Time must be a string" })
  .pipe(z.iso.datetime({ offset: true }));

const actionSchema = z.enum(["CREATE", "UPDATE", "DELETE"], {
  error: "Action must be CREATE, UPDATE, or DELETE",
});

/**
 * Query for the audit log list.
 *
 * Why:
 * Filters mirror the indexed columns — entity/entityId, userId, and action.
 * Time ranges use ISO datetimes so a compliance export can be reproduced
 * exactly from the same query string.
 */
export const listAuditLogsQuerySchema = z.strictObject({
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
  entity: z
    .string({ error: "Entity must be a string" })
    .trim()
    .min(1, "Entity must not be empty")
    .max(64, "Entity must contain at most 64 characters")
    .optional(),
  entityId: resourceIdSchema.optional(),
  userId: resourceIdSchema.optional(),
  action: actionSchema.optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
});

/** URL params for the single-log route. */
export const auditLogParamSchema = z.strictObject({
  logId: resourceIdSchema,
});

/** URL params for the entity-history route. */
export const auditEntityParamSchema = z.strictObject({
  entity: z
    .string({ error: "Entity must be a string" })
    .trim()
    .min(1, "Entity must not be empty")
    .max(64, "Entity must contain at most 64 characters"),
  entityId: resourceIdSchema,
});
