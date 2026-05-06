import type { ZodType } from "zod";

import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  NOTIFICATION_CODES,
  NOTIFICATION_MESSAGES,
} from "@/features/notifications/constants/notification.constants";
import { notificationError } from "@/features/notifications/responses/notification.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type NotificationAdminUser = { branchId?: string | null; id: string; role: string };

/**
 * Allows only admin roles to reach notification management handlers.
 */
export async function requireNotificationAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth;
  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: notificationError({
        code: NOTIFICATION_CODES.FORBIDDEN,
        message: NOTIFICATION_MESSAGES.FORBIDDEN,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }
  return auth;
}

/**
 * Parses JSON bodies with notification-owned validation errors.
 */
export async function parseNotificationBody<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return {
      data: null,
      error: notificationError({
        code: NOTIFICATION_CODES.VALIDATION_ERROR,
        message: parsed.error.issues[0]?.message ?? NOTIFICATION_MESSAGES.VALIDATION_ERROR,
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }
  return { data: parsed.data, error: null };
}

/**
 * Carries expected notification errors across helper boundaries.
 */
export class NotificationVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
