import "server-only";

import { Resend } from "resend";

import type { NotificationPayload } from "@/server/modules/notification/notification.types";
import type { NotificationProvider } from "./provider.types";

/**
 * Email provider — uses Resend when configured.
 *
 * Why:
 * The same Resend client is already wired for OTP and password reset. Keeping
 * the same vendor avoids a second API surface and a second set of secrets.
 * When RESEND_API_KEY is absent, the provider reports itself unconfigured
 * and the dispatcher records the notification as skipped instead of failing
 * the whole request.
 */
export const emailProvider: NotificationProvider = {
  channel: "EMAIL",

  isConfigured: () =>
    Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),

  send: async (payload: NotificationPayload) => {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;
    if (!apiKey || !from) {
      return { delivered: false, reason: "Email provider not configured" };
    }
    if (!payload.recipient) {
      return { delivered: false, reason: "Recipient email missing" };
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      to: payload.recipient,
      subject: payload.title,
      html: payload.body,
    });

    if (error) {
      return { delivered: false, reason: `Resend error: ${error.message}` };
    }
    return { delivered: true };
  },
};
