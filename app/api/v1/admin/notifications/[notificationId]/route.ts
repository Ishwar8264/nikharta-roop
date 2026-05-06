import { handleUpdateNotification } from "@/features/notifications/handlers/notification.handlers";

export const runtime = "nodejs";

type AdminNotificationRouteContext = {
  params: Promise<{ notificationId: string }>;
};

/**
 * Routes admin notification patch requests to the notifications feature handler.
 */
export async function PATCH(
  request: Request,
  context: AdminNotificationRouteContext,
) {
  const { notificationId } = await context.params;
  return handleUpdateNotification(request, notificationId);
}
