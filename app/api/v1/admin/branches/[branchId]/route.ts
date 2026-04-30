import { handleUpdateBranch } from "@/features/branches/handlers/branch.handlers";

export const runtime = "nodejs";

type AdminBranchRouteContext = {
  params: Promise<{
    branchId: string;
  }>;
};

export async function PATCH(request: Request, context: AdminBranchRouteContext) {
  const { branchId } = await context.params;

  return handleUpdateBranch(request, branchId);
}
