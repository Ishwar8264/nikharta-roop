export const runtime = "nodejs";

/**
 * Routes admin media list and create requests to feature handlers.
 */
export {
  handleCreateMedia as POST,
  handleListMedia as GET,
} from "@/features/media/handlers/media.handlers";
