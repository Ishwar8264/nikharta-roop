import { handleUpdateServiceCategory } from "@/features/services/handlers/service-admin.handlers";

export const runtime = "nodejs";

type AdminServiceCategoryRouteContext = {
  params: Promise<{
    categoryId: string;
  }>;
};

/**
 * Routes admin service category updates to the service handler.
 */
export async function PATCH(
  request: Request,
  context: AdminServiceCategoryRouteContext,
) {
  const { categoryId } = await context.params;

  return handleUpdateServiceCategory(request, categoryId);
}
