import "server-only";

import type { NotificationProvider } from "./provider.types";

/**
 * WhatsApp provider — Meta Cloud API-ready.
 *
 * Why:
 * Same rationale as the SMS provider: register today, activate with env
 * vars later. Keeps the notification service channel-agnostic from day one.
 *
 * To activate:
 *   1. Add fetch call to the Meta Graph API (already HTTP-native, no SDK).
 *   2. Fill WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN in .env.
 */
export const whatsappProvider: NotificationProvider = {
  channel: "WHATSAPP",

  isConfigured: () =>
    Boolean(
      process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_ACCESS_TOKEN,
    ),

  send: async (payload) => {
    if (!payload.recipient) {
      return { delivered: false, reason: "Recipient phone missing" };
    }

    // TODO: Uncomment when credentials are ready.
    //
    // const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
    // const token = process.env.WHATSAPP_ACCESS_TOKEN!;
    // const response = await fetch(
    //   `https://graph.facebook.com/v20.0/${phoneId}/messages`,
    //   {
    //     method: "POST",
    //     headers: {
    //       Authorization: `Bearer ${token}`,
    //       "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({
    //       messaging_product: "whatsapp",
    //       to: payload.recipient,
    //       type: "text",
    //       text: { body: `${payload.title}\n\n${payload.body}` },
    //     }),
    //   },
    // );
    // if (!response.ok) {
    //   return { delivered: false, reason: `WhatsApp API ${response.status}` };
    // }
    // return { delivered: true };

    return {
      delivered: false,
      reason: "WhatsApp provider send() not implemented yet",
    };
  },
};
