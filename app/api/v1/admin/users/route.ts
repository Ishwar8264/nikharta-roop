export const runtime = "nodejs";

/**
 * Routes admin user listing requests to feature handlers.
 */
export { handleListAdminUsers as GET } from "@/features/admin-users/handlers/admin-user.handlers";
