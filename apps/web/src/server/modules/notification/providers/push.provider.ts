import "server-only";

import type { NotificationProvider } from "./provider.types";

/**
 * Push provider — Firebase Cloud Messaging-ready.
 *
 * Why:
 * Same rationale as the other stubs. Device token storage is a separate
 * feature (a new table), so this provider is a placeholder until the mobile
 * client exists. When it does, the send implementation reads the token from
 * `payload.data.deviceToken`.
 *
 * To activate:
 *   1. Add a `DeviceToken` model to track per-user FCM tokens.
 *   2. Populate FCM_SERVER_KEY in .env.
 *   3. Implement send() against the FCM HTTP v1 endpoint.
 */
export const pushProvider: NotificationProvider = {
  channel: "PUSH",

  isConfigured: () => Boolean(process.env.FCM_SERVER_KEY),

  send: async () => {
    return {
      delivered: false,
      reason: "Push provider send() not implemented yet",
    };
  },
};
