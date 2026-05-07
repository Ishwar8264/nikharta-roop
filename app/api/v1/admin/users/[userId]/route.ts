import {
  handleGetAdminUser,
  handleUpdateAdminUser,
} from "@/features/admin-users/handlers/admin-user.handlers";

export const runtime = "nodejs";

type AdminUserRouteContext = {
  params: Promise<{ userId: string }>;
};

/**
 * Routes admin user detail requests to feature handlers.
 */
export async function GET(request: Request, context: AdminUserRouteContext) {
  const { userId } = await context.params;
  return handleGetAdminUser(request, userId);
}

/**
 * Routes admin user patch requests to feature handlers.
 */
export async function PATCH(request: Request, context: AdminUserRouteContext) {
  const { userId } = await context.params;
  return handleUpdateAdminUser(request, userId);
}
