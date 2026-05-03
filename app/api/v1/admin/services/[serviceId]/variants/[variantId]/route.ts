import { handleUpdateServiceVariant } from "@/features/services/handlers/service-admin.handlers";

export const runtime = "nodejs";

type AdminServiceVariantRouteContext = {
  params: Promise<{
    serviceId: string;
    variantId: string;
  }>;
};

/**
 * Routes admin service variant updates to the service handler.
 */
export async function PATCH(
  request: Request,
  context: AdminServiceVariantRouteContext,
) {
  const { serviceId, variantId } = await context.params;

  return handleUpdateServiceVariant(request, serviceId, variantId);
}
