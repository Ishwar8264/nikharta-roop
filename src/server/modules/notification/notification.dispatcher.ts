import "server-only";

import type { NotificationChannel } from "@/generated/prisma/client";
import {
  createNotificationRow,
  loadRecipientContact,
} from "./notification.repository";
import type { NotificationPayload, ProviderResult } from "./notification.types";
import { PROVIDERS } from "./providers";

/**
 * Delivers one notification through one channel.
 *
 * Why:
 * The dispatcher is the only place that knows how to turn a high-level
 * "notify this user" call into a persisted row plus an outbound attempt.
 * Providers stay small; routes and other services just call this function.
 *
 * Failure semantics:
 *   - Provider missing or unconfigured → row persisted with status PENDING.
 *   - Provider throws → row persisted with status FAILED.
 *   - Provider succeeds → row persisted with status SENT and sentAt set.
 * In every case the caller receives the persisted row, so downstream code
 * (audit, retries) can act on it.
 */
export async function dispatchNotification(input: {
  userId: string;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
}): Promise<{ delivered: boolean; reason?: string }> {
  const provider = PROVIDERS[input.channel];

  const recipient = await loadRecipientContact(input.userId);
  if (!recipient) {
    return { delivered: false, reason: "Recipient user not found" };
  }

  const payload: NotificationPayload = {
    userId: input.userId,
    recipient:
      input.channel === "EMAIL"
        ? recipient.email
        : input.channel === "SMS" || input.channel === "WHATSAPP"
          ? recipient.phone
          : null,
    title: input.title,
    body: input.body,
    data: input.data ?? null,
  };

  // Provider missing → still persist so the inbox shows the intent.
  if (!provider) {
    await createNotificationRow({
      userId: input.userId,
      title: input.title,
      body: input.body,
      channel: input.channel,
      status: "PENDING",
      data: input.data ? JSON.stringify(input.data) : null,
      sentAt: null,
    });
    return {
      delivered: false,
      reason: `No provider for channel ${input.channel}`,
    };
  }

  // Unconfigured → persist as PENDING so a future retry can pick it up.
  if (!provider.isConfigured()) {
    await createNotificationRow({
      userId: input.userId,
      title: input.title,
      body: input.body,
      channel: input.channel,
      status: "PENDING",
      data: input.data ? JSON.stringify(input.data) : null,
      sentAt: null,
    });
    return {
      delivered: false,
      reason: `Provider ${input.channel} not configured — row saved for retry`,
    };
  }

  let result: ProviderResult;
  try {
    result = await provider.send(payload);
  } catch (error) {
    await createNotificationRow({
      userId: input.userId,
      title: input.title,
      body: input.body,
      channel: input.channel,
      status: "FAILED",
      data: input.data ? JSON.stringify(input.data) : null,
      sentAt: null,
    });
    console.error(`Notification dispatch failed on ${input.channel}`, error);
    return { delivered: false, reason: "Provider threw an error" };
  }

  await createNotificationRow({
    userId: input.userId,
    title: input.title,
    body: input.body,
    channel: input.channel,
    status: result.delivered ? "SENT" : "FAILED",
    data: input.data ? JSON.stringify(input.data) : null,
    sentAt: result.delivered ? new Date() : null,
  });

  return { delivered: result.delivered, reason: result.reason };
}
