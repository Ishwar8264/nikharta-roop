import type { AuthEventType, Prisma } from "@prisma/client";

export type AuthEventRow = {
  createdAt: Date;
  id: string;
  ipAddress: string | null;
  metadata: Prisma.JsonValue;
  mobile: string | null;
  type: AuthEventType;
  user: Record<string, unknown> | null;
  userAgent: string | null;
  userId: string | null;
};

/**
 * Normalizes one auth event row for public admin responses.
 */
export function toPublicAuthEvent(event: AuthEventRow) {
  return event;
}
