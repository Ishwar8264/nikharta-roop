export const runtime = "nodejs";

/**
 * Routes admin notification list and create requests to feature handlers.
 */
export {
  handleCreateNotification as POST,
  handleListAdminNotifications as GET,
} from "@/features/notifications/handlers/notification.handlers";
