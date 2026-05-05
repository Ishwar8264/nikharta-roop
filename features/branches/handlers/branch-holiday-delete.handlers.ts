import { getDb } from "@/db";
import {
  BRANCH_CODES,
  BRANCH_MESSAGES,
} from "@/features/branches/constants/branch.constants";
import { branchJson } from "@/features/branches/responses/branch.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { handleBranchHolidayError } from "./branch-holiday.errors";
import { assertHolidayBelongsToBranch } from "./branch-holiday-guards";
import {
  assertCanManageHolidayBranch,
  requireBranchHolidayAdmin,
} from "./branch-holiday.shared";

/**
 * Handles admin branch holiday deletion.
 */
export async function handleDeleteBranchHoliday(
  request: Request,
  branchId: string,
  holidayId: string,
) {
  const auth = await requireBranchHolidayAdmin(request);
  if (!auth.success) return auth.error;
  return deleteBranchHoliday(branchId, holidayId, auth.session.user);
}

async function deleteBranchHoliday(
  branchId: string,
  holidayId: string,
  admin: { branchId?: string | null; id: string; role: string },
) {
  try {
    assertCanManageHolidayBranch(admin, branchId);
    await assertHolidayBelongsToBranch(holidayId, branchId);
    await getDb().branchHoliday.delete({ where: { id: holidayId } });
    return branchJson({
      code: BRANCH_CODES.HOLIDAY_DELETED,
      data: { holidayId },
      message: BRANCH_MESSAGES.HOLIDAY_DELETED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleBranchHolidayError(error, {
      code: BRANCH_CODES.HOLIDAY_DELETE_FAILED,
      handler: "deleteBranchHoliday",
      message: BRANCH_MESSAGES.HOLIDAY_DELETE_FAILED,
    });
  }
}
