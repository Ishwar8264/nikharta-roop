import { handleGetBranch } from "@/features/branches/handlers/branch.handlers";

export const runtime = "nodejs";

type BranchRouteContext = {
  params: Promise<{
    branchId: string;
  }>;
};

export async function GET(_request: Request, context: BranchRouteContext) {
  const { branchId } = await context.params;

  return handleGetBranch(branchId);
}
