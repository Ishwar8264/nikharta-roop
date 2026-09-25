import "server-only";

import { prisma } from "@/lib/prisma";

/** The three actions the audit log records. */
export type AuditAction = "CREATE" | "UPDATE" | "DELETE";

export interface AuditWriteInput {
  /** Caller's user id. Pass null for system-driven events. */
  userId: string | null;
  action: AuditAction;
  /** Logical entity name — "Salon", "Appointment", "BlogPost", etc. */
  entity: string;
  /** Primary key of the affected row, when applicable. */
  entityId?: string | null;
  /** Pre-change snapshot as a plain object. Serialized to JSON internally. */
  oldData?: unknown;
  /** Post-change snapshot as a plain object. Serialized to JSON internally. */
  newData?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Writes an audit entry fire-and-forget.
 *
 * Why:
 * Audit logging must never be able to fail a business operation. A slow or
 * degraded audit write should not roll back a successful booking or
 * create a customer-visible error. Callers invoke this as a plain function
 * and move on; failures are logged to the server console for later
 * inspection but never surface to the request.
 *
 * This is intentionally synchronous-looking so it can be dropped into a
 * service without awaiting it. If the transaction that triggered it rolls
 * back, the audit entry may still persist — an acceptable trade-off that
 * keeps the business path fast and independent of the audit path.
 */
export function writeAuditLog(input: AuditWriteInput): void {
  prisma.auditLog
    .create({
      data: {
        userId: input.userId,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        oldData:
          input.oldData !== undefined ? JSON.stringify(input.oldData) : null,
        newData:
          input.newData !== undefined ? JSON.stringify(input.newData) : null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    })
    .catch((error) => {
      console.error("Audit log write failed", {
        entity: input.entity,
        entityId: input.entityId,
        action: input.action,
        error,
      });
    });
}
