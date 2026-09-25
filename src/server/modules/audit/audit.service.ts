import "server-only";

import {
  AuditLogAccessDeniedError,
  AuditLogNotFoundError,
} from "./audit.errors";
import { toPublicAuditLog } from "./audit.mapper";
import { findAuditLogById, listAuditLogs } from "./audit.repository";
import type {
  ListAuditLogsQuery,
  PaginatedAuditLogs,
  PublicAuditLog,
} from "./audit.types";

/** Rejects anyone who is not a platform administrator. */
function assertCanReadAuditLogs(role: string): void {
  if (role !== "SUPER_ADMIN") throw new AuditLogAccessDeniedError();
}

/**
 * Lists audit entries. SUPER_ADMIN only.
 *
 * Why:
 * Audit rows can contain sensitive snapshots (customer details, prices).
 * Restricting reads to the platform administrator role keeps that data out
 * of every other user's reach while leaving the write path open to any
 * service that needs it.
 */
export async function listLogs(
  callerRole: string,
  query: ListAuditLogsQuery,
): Promise<PaginatedAuditLogs> {
  assertCanReadAuditLogs(callerRole);

  const result = await listAuditLogs(query);
  return {
    items: result.items.map(toPublicAuditLog),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/** Loads a single audit entry. SUPER_ADMIN only. */
export async function getLog(
  callerRole: string,
  logId: string,
): Promise<PublicAuditLog> {
  assertCanReadAuditLogs(callerRole);

  const row = await findAuditLogById(logId);
  if (!row) throw new AuditLogNotFoundError();
  return toPublicAuditLog(row);
}

/**
 * Returns the full change history for one entity.
 *
 * Why:
 * A thin wrapper over the list query so clients can link directly to
 * `/audit-logs/entity/Appointment/{id}` without hand-building a query
 * string. It uses the same authorization and paging rules as the list.
 */
export async function listEntityHistory(
  callerRole: string,
  entity: string,
  entityId: string,
  query: ListAuditLogsQuery,
): Promise<PaginatedAuditLogs> {
  assertCanReadAuditLogs(callerRole);

  const result = await listAuditLogs({
    ...query,
    entity,
    entityId,
  });
  return {
    items: result.items.map(toPublicAuditLog),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}
