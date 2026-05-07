export const runtime = "nodejs";

/**
 * Routes admin auth event listing requests to the auth-events feature handler.
 */
export { handleListAuthEvents as GET } from "@/features/auth-events/handlers/auth-event.handlers";
