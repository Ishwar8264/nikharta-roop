import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Deletes OTP rows that are expired and safe to remove.
 *
 * Why:
 * The OTP table grows by one row per send and is only ever read by the
 * verify endpoint, which already filters on `isUsed` and `expiresAt`. Rows
 * that are used or expired more than a day ago have no further purpose —
 * keeping them wastes storage and slows the `[userId, isUsed]` index.
 *
 * Safety:
 * Only rows older than 24 hours past expiry are deleted. The grace window
 * means a support engineer investigating an incident from the last day
 * still has the data available, while older history is pruned aggressively.
 *
 * Idempotency:
 * `deleteMany` is naturally idempotent — re-running it on an already-empty
 * window is a no-op.
 */
export async function runOtpCleanupJob(context: {
  deadline: number;
  hasTimeLeft: () => boolean;
}): Promise<{ processed: number; details: { deleted: number } }> {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.otp.deleteMany({
    where: {
      OR: [
        { isUsed: true, createdAt: { lt: cutoff } },
        { expiresAt: { lt: cutoff } },
      ],
    },
  });

  if (!context.hasTimeLeft()) {
    console.warn("OTP cleanup job completed at the time budget boundary", {
      deleted: result.count,
    });
  }

  return {
    processed: result.count,
    details: { deleted: result.count },
  };
}
