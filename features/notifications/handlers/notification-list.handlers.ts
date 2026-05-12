import { getDb } from "@/db";
import {
  NOTIFICATION_CODES,
  NOTIFICATION_MESSAGES,
} from "@/features/notifications/constants/notification.constants";
import { notificationSelect } from "@/features/notifications/helpers/notification.selectors";
import {
  listMyNotificationsQuerySchema,
  listNotificationsQuerySchema,
} from "@/schema/notifications/schema.notification";
import { handleNotificationError } from "./notification.errors";
import {
  notificationListResponse,
  parseNotificationQuery,
} from "./notification-list.shared";
import { resolveNotificationBranch } from "./notification.scopes";
import { requireNotificationAdmin } from "./notification.shared";
import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";

/**
 * Handles admin notification listing requests.
 */
export async function handleListAdminNotifications(request: Request) {
  const auth = await requireNotificationAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseNotificationQuery(request, listNotificationsQuerySchema);
  if (!query.success) return query.error;
  try {
    const branchId = resolveNotificationBranch(query.data.branchId, auth.session.user);
    const notifications = await getDb().notification.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: notificationSelect(),
      take: query.data.limit ?? 50,
      where: {
        branchId,
        channel: query.data.channel,
        status: query.data.status,
        trigger: query.data.trigger,
        userId: query.data.userId,
      },
    });
    return notificationListResponse(notifications, query.data.limit ?? 50);
  } catch (error) {
    return handleNotificationError(error, {
      code: NOTIFICATION_CODES.NOTIFICATION_LOAD_FAILED,
      handler: "handleListAdminNotifications",
      message: NOTIFICATION_MESSAGES.NOTIFICATION_LOAD_FAILED,
    });
  }
}

/**
 * Handles current user's notification listing requests.
 */
export async function handleListMyNotifications(request: Request) {
  const auth = await getAuthenticatedSession(request);
  if (!auth.success) return auth.error;
  const query = parseNotificationQuery(request, listMyNotificationsQuerySchema);
  if (!query.success) return query.error;
  const notifications = await getDb().notification.findMany({
    orderBy: [{ createdAt: "desc" }],
    select: notificationSelect(),
    take: query.data.limit ?? 50,
    where: { userId: auth.session.userId },
  });
  return notificationListResponse(notifications, query.data.limit ?? 50);
}
