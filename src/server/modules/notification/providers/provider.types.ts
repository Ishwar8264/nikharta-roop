import "server-only";

import type { NotificationChannel } from "@/generated/prisma/client";
import type {
  NotificationPayload,
  ProviderResult,
} from "@/server/modules/notification/notification.types";

/**
 * Contract every notification channel implements.
 *
 * Why:
 * The dispatcher only knows this interface. Adding a new channel is "create
 * a provider file, register it in the provider map" — no changes to the
 * dispatcher, service, or routes. The `isConfigured` gate lets the codebase
 * ship with credentials-based activation: a provider that lacks env vars is
 * silently skipped rather than crashing the request.
 */
export interface NotificationProvider {
  channel: NotificationChannel;
  /** True when the environment has everything the provider needs to send. */
  isConfigured: () => boolean;
  /** Attempts delivery. Only called when `isConfigured()` is true. */
  send: (payload: NotificationPayload) => Promise<ProviderResult>;
}
