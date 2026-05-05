import {
  handleCreateBranchHoliday,
} from "@/features/branches/handlers/branch-holiday-create.handlers";
import {
  handleListBranchHolidays,
} from "@/features/branches/handlers/branch-holiday-list.handlers";

export const runtime = "nodejs";

type AdminBranchHolidayRouteContext = {
  params: Promise<{ branchId: string }>;
};

/**
 * Routes admin branch holiday listing requests to the branch feature handler.
 */
export async function GET(
  request: Request,
  context: AdminBranchHolidayRouteContext,
) {
  const { branchId } = await context.params;
  return handleListBranchHolidays(request, branchId);
}

/**
 * Routes admin branch holiday creation requests to the branch feature handler.
 */
export async function POST(
  request: Request,
  context: AdminBranchHolidayRouteContext,
) {
  const { branchId } = await context.params;
  return handleCreateBranchHoliday(request, branchId);
}
