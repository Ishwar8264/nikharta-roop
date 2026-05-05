import { getDb } from "@/db";
import {
  BRANCH_CODES,
  BRANCH_MESSAGES,
} from "@/features/branches/constants/branch.constants";
import { toPublicBranchHoliday } from "@/features/branches/helpers/branch-holiday.mapper";
import { branchHolidaySelect } from "@/features/branches/helpers/branch-holiday.selectors";
import { branchJson } from "@/features/branches/responses/branch.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  toHolidayDate,
  updateBranchHolidaySchema,
  type UpdateBranchHolidayInput,
} from "@/schema/branches/schema.branch-holiday";
import { handleBranchHolidayError } from "./branch-holiday.errors";
import { assertHolidayBelongsToBranch } from "./branch-holiday-guards";
import {
  assertCanManageHolidayBranch,
  parseBranchHolidayBody,
  requireBranchHolidayAdmin,
} from "./branch-holiday.shared";

/**
 * Handles admin branch holiday updates.
 */
export async function handleUpdateBranchHoliday(
  request: Request,
  branchId: string,
  holidayId: string,
) {
  const auth = await requireBranchHolidayAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseBranchHolidayBody(request, updateBranchHolidaySchema);
  if (body.error) return body.error;
  return updateBranchHoliday(branchId, holidayId, body.data, auth.session.user);
}

async function updateBranchHoliday(
  branchId: string,
  holidayId: string,
  input: UpdateBranchHolidayInput,
  admin: { branchId?: string | null; id: string; role: string },
) {
  try {
    assertCanManageHolidayBranch(admin, branchId);
    await assertHolidayBelongsToBranch(holidayId, branchId);
    const holiday = await getDb().branchHoliday.update({
      data: { ...input, date: input.date ? toHolidayDate(input.date) : undefined },
      select: branchHolidaySelect(),
      where: { id: holidayId },
    });
    return branchJson({
      code: BRANCH_CODES.HOLIDAY_UPDATED,
      data: { holiday: toPublicBranchHoliday(holiday) },
      message: BRANCH_MESSAGES.HOLIDAY_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleBranchHolidayError(error, {
      code: BRANCH_CODES.HOLIDAY_UPDATE_FAILED,
      handler: "updateBranchHoliday",
      message: BRANCH_MESSAGES.HOLIDAY_UPDATE_FAILED,
    });
  }
}
