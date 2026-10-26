import "server-only";

import type { NotificationProvider } from "./provider.types";

/**
 * SMS provider — Twilio-ready, activates when credentials exist.
 *
 * Why:
 * The provider is registered today so callers can pass `channel: "SMS"`
 * without changing code. When `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`
 * are populated in the environment, `isConfigured()` flips to true and the
 * dispatcher will call `send` for real. Until then, calls fall through as
 * "skipped — not configured" without failing the request.
 *
 * To activate:
 *   1. `pnpm add twilio`
 *   2. Fill TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_SMS_FROM in .env
 *   3. Uncomment the send implementation below
 */
export const smsProvider: NotificationProvider = {
  channel: "SMS",

  isConfigured: () =>
    Boolean(
      process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_SMS_FROM,
    ),

  send: async (payload) => {
    if (!payload.recipient) {
      return { delivered: false, reason: "Recipient phone missing" };
    }

    // TODO: Uncomment and install `twilio` when credentials are ready.
    //
    // const { default: twilio } = await import("twilio");
    // const client = twilio(
    //   process.env.TWILIO_ACCOUNT_SID!,
    //   process.env.TWILIO_AUTH_TOKEN!,
    // );
    // await client.messages.create({
    //   from: process.env.TWILIO_SMS_FROM!,
    //   to: payload.recipient,
    //   body: `${payload.title}\n\n${payload.body}`,
    // });
    // return { delivered: true };

    return {
      delivered: false,
      reason: "SMS provider send() not implemented yet",
    };
  },
};
