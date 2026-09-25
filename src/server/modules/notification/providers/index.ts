import "server-only";

import type { NotificationChannel } from "@/generated/prisma/client";

import { emailProvider } from "./email.provider";
import { inAppProvider } from "./in-app.provider";
import type { NotificationProvider } from "./provider.types";
import { pushProvider } from "./push.provider";
import { smsProvider } from "./sms.provider";
import { whatsappProvider } from "./whatsapp.provider";

/**
 * Provider registry — one entry per supported channel.
 *
 * Why:
 * The dispatcher resolves a channel to a provider via this map. Adding a
 * new channel means creating a provider file and registering it here — no
 * changes to the dispatcher, service, or routes.
 */
export const PROVIDERS: Record<NotificationChannel, NotificationProvider> = {
  EMAIL: emailProvider,
  SMS: smsProvider,
  WHATSAPP: whatsappProvider,
  PUSH: pushProvider,
  IN_APP: inAppProvider,
};

export type { NotificationProvider };
