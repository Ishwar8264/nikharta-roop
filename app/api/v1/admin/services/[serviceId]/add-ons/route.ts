import { handleCreateServiceAddOn } from "@/features/services/handlers/service-admin.handlers";

export const runtime = "nodejs";

type AdminServiceAddOnRouteContext = {
  params: Promise<{
    serviceId: string;
  }>;
};

/**
 * Routes admin service add-on creation to the service handler.
 */
export async function POST(
  request: Request,
  context: AdminServiceAddOnRouteContext,
) {
  const { serviceId } = await context.params;

  return handleCreateServiceAddOn(request, serviceId);
}
