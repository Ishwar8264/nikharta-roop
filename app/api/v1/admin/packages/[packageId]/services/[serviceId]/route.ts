import { handleRemovePackageService } from "@/features/packages/handlers/package.handlers";

export const runtime = "nodejs";

type AdminPackageServiceRouteContext = {
  params: Promise<{ packageId: string; serviceId: string }>;
};

export async function DELETE(
  request: Request,
  context: AdminPackageServiceRouteContext,
) {
  const { packageId, serviceId } = await context.params;
  return handleRemovePackageService(request, packageId, serviceId);
}
