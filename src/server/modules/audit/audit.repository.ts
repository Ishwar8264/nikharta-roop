import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/** Columns returned on every audit response. */
const AUDIT_SELECT = {
  id: true,
  userId: true,
  action: true,
  entity: true,
  entityId: true,
  oldData: true,
  newData: true,
  ipAddress: true,
  userAgent: true,
  createdAt: true,
} as const satisfies Prisma.AuditLogSelect;

/**
 * Cursor-paginated audit log listing.
 *
 * Why:
 * Newest-first ordering matches how compliance reviewers read the log.
 * Filters are optional and compose with `AND` semantics — passing `entity`
 * and `userId` together returns only rows matching both.
 */
export async function listAuditLogs(input: {
  cursor?: string;
  limit: number;
  entity?: string;
  entityId?: string;
  userId?: string;
  action?: string;
  from?: string;
  to?: string;
}) {
  const where: Prisma.AuditLogWhereInput = {
    ...(input.entity ? { entity: input.entity } : {}),
    ...(input.entityId ? { entityId: input.entityId } : {}),
    ...(input.userId ? { userId: input.userId } : {}),
    ...(input.action ? { action: input.action } : {}),
    ...(input.from || input.to
      ? {
          createdAt: {
            ...(input.from ? { gte: new Date(input.from) } : {}),
            ...(input.to ? { lte: new Date(input.to) } : {}),
          },
        }
      : {}),
  };

  const rows = await prisma.auditLog.findMany({
    where,
    select: AUDIT_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Loads a single audit entry by id. */
export async function findAuditLogById(id: string) {
  return prisma.auditLog.findUnique({
    where: { id },
    select: AUDIT_SELECT,
  });
}
