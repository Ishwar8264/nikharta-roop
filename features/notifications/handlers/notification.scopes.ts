import { getDb } from "@/db";
import {
  NOTIFICATION_CODES,
  NOTIFICATION_MESSAGES,
} from "@/features/notifications/constants/notification.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  NotificationVisibleError,
  type NotificationAdminUser,
} from "./notification.shared";

/**
 * Resolves branch scope for admin notification queries.
 */
export function resolveNotificationBranch(
  requestedBranchId: string | undefined,
  admin: NotificationAdminUser,
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    return admin.branchId;
  }
  throwForbidden();
}

/**
 * Loads one notification and validates admin branch scope.
 */
export async function loadManageableNotification(
  notificationId: string,
  admin: NotificationAdminUser,
) {
  const notification = await getDb().notification.findUnique({
    select: { branchId: true, id: true, userId: true },
    where: { id: notificationId },
  });
  if (!notification) return null;
  if (
    admin.role === "SUPER_ADMIN" ||
    !notification.branchId ||
    admin.branchId === notification.branchId
  ) {
    return notification;
  }
  throwForbidden();
}

/**
 * Throws a forbidden notification access error.
 */
function throwForbidden(): never {
  throw new NotificationVisibleError(
    NOTIFICATION_CODES.FORBIDDEN,
    NOTIFICATION_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}
