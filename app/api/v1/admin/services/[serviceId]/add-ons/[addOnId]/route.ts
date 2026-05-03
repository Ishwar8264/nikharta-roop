import { handleUpdateServiceAddOn } from "@/features/services/handlers/service-admin.handlers";

export const runtime = "nodejs";

type AdminServiceAddOnRouteContext = {
  params: Promise<{
    addOnId: string;
    serviceId: string;
  }>;
};

/**
 * Routes admin service add-on updates to the service handler.
 */
export async function PATCH(
  request: Request,
  context: AdminServiceAddOnRouteContext,
) {
  const { addOnId, serviceId } = await context.params;

  return handleUpdateServiceAddOn(request, serviceId, addOnId);
}
