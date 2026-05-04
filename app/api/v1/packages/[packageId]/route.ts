import { handleGetPackage } from "@/features/packages/handlers/package.handlers";

export const runtime = "nodejs";

type PackageRouteContext = {
  params: Promise<{ packageId: string }>;
};

export async function GET(request: Request, context: PackageRouteContext) {
  const { packageId } = await context.params;
  return handleGetPackage(request, packageId);
}
