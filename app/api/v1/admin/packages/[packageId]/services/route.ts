import { handleAssignPackageService } from "@/features/packages/handlers/package.handlers";

export const runtime = "nodejs";

type AdminPackageServiceRouteContext = {
  params: Promise<{ packageId: string }>;
};

export async function POST(
  request: Request,
  context: AdminPackageServiceRouteContext,
) {
  const { packageId } = await context.params;
  return handleAssignPackageService(request, packageId);
}
