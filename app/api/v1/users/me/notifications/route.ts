export const runtime = "nodejs";

/**
 * Routes current user's notification list requests to the feature handler.
 */
export { handleListMyNotifications as GET } from "@/features/notifications/handlers/notification.handlers";
