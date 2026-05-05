import {
  handleUpdateBranchHoliday,
} from "@/features/branches/handlers/branch-holiday-update.handlers";
import {
  handleDeleteBranchHoliday,
} from "@/features/branches/handlers/branch-holiday-delete.handlers";

export const runtime = "nodejs";

type AdminBranchHolidayRouteContext = {
  params: Promise<{ branchId: string; holidayId: string }>;
};

/**
 * Routes admin branch holiday patch requests to the branch feature handler.
 */
export async function PATCH(
  request: Request,
  context: AdminBranchHolidayRouteContext,
) {
  const { branchId, holidayId } = await context.params;
  return handleUpdateBranchHoliday(request, branchId, holidayId);
}

/**
 * Routes admin branch holiday deletion requests to the branch feature handler.
 */
export async function DELETE(
  request: Request,
  context: AdminBranchHolidayRouteContext,
) {
  const { branchId, holidayId } = await context.params;
  return handleDeleteBranchHoliday(request, branchId, holidayId);
}
