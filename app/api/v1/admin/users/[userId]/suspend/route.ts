import { handleSuspendAdminUser } from "@/features/admin-users/handlers/admin-user.handlers";

export const runtime = "nodejs";

type AdminUserSuspendRouteContext = {
  params: Promise<{ userId: string }>;
};

/**
 * Routes admin user suspend/reactivate requests to feature handlers.
 */
export async function PATCH(
  request: Request,
  context: AdminUserSuspendRouteContext,
) {
  const { userId } = await context.params;
  return handleSuspendAdminUser(request, userId);
}
