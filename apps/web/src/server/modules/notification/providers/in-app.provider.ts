import "server-only";

import type { NotificationProvider } from "./provider.types";

/**
 * In-app provider — the notification row *is* the delivery.
 *
 * Why:
 * `IN_APP` notifications live in the database and are pulled by the client
 * via the API. There is no external service to call, so this provider is
 * always "configured" and its `send` is a no-op that reports success. The
 * dispatcher still records the row so the inbox works uniformly.
 */
export const inAppProvider: NotificationProvider = {
  channel: "IN_APP",
  isConfigured: () => true,
  send: async () => ({ delivered: true }),
};
