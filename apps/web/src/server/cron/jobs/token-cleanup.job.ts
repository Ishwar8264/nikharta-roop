import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Deletes refresh tokens that are revoked or expired and no longer needed.
 *
 * Why:
 * Every login creates a refresh token row. Without cleanup, the table grows
 * without bound and slows the token-rotation lookup that runs on every
 * refresh call. Rows that are revoked or past their expiry have no purpose:
 * the auth flow already ignores them.
 *
 * Safety:
 * Only rows whose `expiresAt` is more than 7 days in the past are deleted.
 * That window covers every legitimate refresh attempt plus the
 * "reuse detection" grace period, while still keeping the table small.
 * Revoked-but-not-expired rows are left alone so an audit of recent
 * revocations remains possible.
 *
 * Idempotency:
 * `deleteMany` is a no-op on an empty window.
 */
export async function runTokenCleanupJob(context: {
  deadline: number;
  hasTimeLeft: () => boolean;
}): Promise<{ processed: number; details: { deleted: number } }> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: { lt: cutoff },
    },
  });

  if (!context.hasTimeLeft()) {
    console.warn("Token cleanup job completed at the time budget boundary", {
      deleted: result.count,
    });
  }

  return {
    processed: result.count,
    details: { deleted: result.count },
  };
}
