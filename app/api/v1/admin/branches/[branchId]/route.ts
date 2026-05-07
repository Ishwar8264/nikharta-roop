import {
  handleAdminGetBranch,
  handleUpdateBranch,
} from "@/features/branches/handlers/branch.handlers";

export const runtime = "nodejs";

type AdminBranchRouteContext = {
  params: Promise<{
    branchId: string;
  }>;
};

/**
 * Routes admin branch detail requests to the branch management handler.
 */
export async function GET(request: Request, context: AdminBranchRouteContext) {
  const { branchId } = await context.params;

  return handleAdminGetBranch(request, branchId);
}

/**
 * Routes admin branch patch requests to the branch management handler.
 */
export async function PATCH(request: Request, context: AdminBranchRouteContext) {
  const { branchId } = await context.params;

  return handleUpdateBranch(request, branchId);
}
