import { handleMarkNotificationRead } from "@/features/notifications/handlers/notification.handlers";

export const runtime = "nodejs";

type UserNotificationReadRouteContext = {
  params: Promise<{ notificationId: string }>;
};

/**
 * Routes current user's notification read acknowledgements to the feature handler.
 */
export async function PATCH(
  request: Request,
  context: UserNotificationReadRouteContext,
) {
  const { notificationId } = await context.params;
  return handleMarkNotificationRead(request, notificationId);
}
