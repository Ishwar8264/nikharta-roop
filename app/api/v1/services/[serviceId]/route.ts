import { handleGetService } from "@/features/services/handlers/service.handlers";

export const runtime = "nodejs";

type ServiceRouteContext = {
  params: Promise<{
    serviceId: string;
  }>;
};

/**
 * Routes public service detail requests to the services feature handler.
 */
export async function GET(request: Request, context: ServiceRouteContext) {
  const { serviceId } = await context.params;

  return handleGetService(request, serviceId);
}
