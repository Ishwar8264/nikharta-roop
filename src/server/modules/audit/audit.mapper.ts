import "server-only";

import type { PublicAuditLog } from "./audit.types";

interface AuditRow {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: string | null;
  newData: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/** Parses a stored JSON string, returning null on any failure. */
function safeJsonParse(input: string | null): Record<string, unknown> | null {
  if (!input) return null;
  try {
    const parsed = JSON.parse(input);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Converts a Prisma audit row into the public shape.
 *
 * Why:
 * `oldData` and `newData` are stored as JSON strings to keep them opaque to
 * the database. Parsing here means clients never touch JSON.parse on the
 * response payload and malformed rows degrade to null instead of throwing.
 */
export function toPublicAuditLog(row: AuditRow): PublicAuditLog {
  return {
    id: row.id,
    userId: row.userId,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    oldData: safeJsonParse(row.oldData),
    newData: safeJsonParse(row.newData),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt,
  };
}
