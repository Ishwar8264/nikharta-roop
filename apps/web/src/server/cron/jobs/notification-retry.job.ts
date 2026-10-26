import "server-only";

import { prisma } from "@/lib/prisma";
import { dispatchNotification } from "@/server/modules/notification/notification.dispatcher";

/**
 * Retries notifications that are stuck in the PENDING state.
 *
 * Why:
 * A notification row lands in PENDING when the dispatcher ran but the
 * provider was not configured (missing env var) or the channel had no
 * registered provider yet. Once the operator adds the missing credentials
 * and redeploys, this job is the mechanism that flushes the backlog —
 * without it, those rows would sit in the table forever.
 *
 * Idempotency:
 * The dispatcher itself decides whether a channel is now configured and
 * whether the send succeeds. If the provider is *still* unconfigured, the
 * retry leaves the row in PENDING and the next invocation will try again.
 * If the send succeeds, the dispatcher flips the row to SENT and this job
 * will never see it again.
 *
 * Only rows older than a small grace period are picked up so a notification
 * created in the last few seconds is not retried while the original send
 * is still in flight.
 */
export async function runNotificationRetryJob(context: {
  deadline: number;
  hasTimeLeft: () => boolean;
}): Promise<{
  processed: number;
  details: { sent: number; stillPending: number };
}> {
  // Skip rows younger than 5 minutes so we do not race the original attempt.
  const minAge = new Date(Date.now() - 5 * 60 * 1000);

  const candidates = await prisma.notification.findMany({
    where: {
      status: "PENDING",
      createdAt: { lte: minAge },
    },
    select: {
      id: true,
      userId: true,
      title: true,
      body: true,
      channel: true,
      data: true,
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  let sent = 0;
  let stillPending = 0;

  for (const notification of candidates) {
    if (!context.hasTimeLeft()) {
      console.warn("Notification retry job reached its time budget", {
        processed: sent + stillPending,
        remaining: candidates.length,
      });
      break;
    }

    // Parse the stored JSON blob back into an object. A malformed payload
    // is treated as null so the retry does not crash on legacy rows.
    const parsedData = safeJsonParse(notification.data);

    const result = await dispatchNotification({
      userId: notification.userId,
      channel: notification.channel,
      title: notification.title,
      body: notification.body,
      data: parsedData,
    });

    if (result.delivered) {
      sent += 1;
    } else {
      stillPending += 1;
    }
  }

  return {
    processed: sent + stillPending,
    details: { sent, stillPending },
  };
}

/** Parses a JSON string, returning null on any failure. */
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
