import { handleUpdateAdminPackage } from "@/features/packages/handlers/package.handlers";

export const runtime = "nodejs";

type AdminPackageRouteContext = {
  params: Promise<{ packageId: string }>;
};

export async function PATCH(
  request: Request,
  context: AdminPackageRouteContext,
) {
  const { packageId } = await context.params;
  return handleUpdateAdminPackage(request, packageId);
}
