import { handleCreateServiceVariant } from "@/features/services/handlers/service-admin.handlers";

export const runtime = "nodejs";

type AdminServiceVariantRouteContext = {
  params: Promise<{
    serviceId: string;
  }>;
};

/**
 * Routes admin service variant creation to the service handler.
 */
export async function POST(
  request: Request,
  context: AdminServiceVariantRouteContext,
) {
  const { serviceId } = await context.params;

  return handleCreateServiceVariant(request, serviceId);
}
