import { handleUpdateAdminService } from "@/features/services/handlers/service-admin.handlers";

export const runtime = "nodejs";

type AdminServiceRouteContext = {
  params: Promise<{
    serviceId: string;
  }>;
};

/**
 * Routes admin service updates to the service handler.
 */
export async function PATCH(request: Request, context: AdminServiceRouteContext) {
  const { serviceId } = await context.params;

  return handleUpdateAdminService(request, serviceId);
}
