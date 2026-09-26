import type { z } from "zod";

import type { listAuditLogsQuerySchema } from "./audit.schema";

export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;

/**
 * Public audit log entry.
 *
 * Why:
 * `oldData` and `newData` are exposed as parsed objects (not raw JSON
 * strings) so clients can render diffs without a second parse step. When the
 * stored JSON is malformed, the field is returned as null so the row still
 * serializes.
 */
export interface PublicAuditLog {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldData: Record<string, unknown> | null;
  newData: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface PaginatedAuditLogs {
  items: PublicAuditLog[];
  nextCursor: string | null;
  hasMore: boolean;
}
