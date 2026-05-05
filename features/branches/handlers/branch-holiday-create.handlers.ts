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
  createBranchHolidaySchema,
  toHolidayDate,
  type CreateBranchHolidayInput,
} from "@/schema/branches/schema.branch-holiday";
import { handleBranchHolidayError } from "./branch-holiday.errors";
import {
  assertCanManageHolidayBranch,
  assertHolidayBranchExists,
  parseBranchHolidayBody,
  requireBranchHolidayAdmin,
  type BranchHolidayAdmin,
} from "./branch-holiday.shared";

/**
 * Handles admin branch holiday creation.
 */
export async function handleCreateBranchHoliday(request: Request, branchId: string) {
  const auth = await requireBranchHolidayAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseBranchHolidayBody(request, createBranchHolidaySchema);
  if (body.error) return body.error;
  return createBranchHoliday(branchId, body.data, auth.session.user);
}

async function createBranchHoliday(
  branchId: string,
  input: CreateBranchHolidayInput,
  admin: BranchHolidayAdmin,
) {
  try {
    assertCanManageHolidayBranch(admin, branchId);
    await assertHolidayBranchExists(branchId);
    const holiday = await getDb().branchHoliday.create({
      data: { ...input, branchId, date: toHolidayDate(input.date) },
      select: branchHolidaySelect(),
    });
    return branchJson({
      code: BRANCH_CODES.HOLIDAY_CREATED,
      data: { holiday: toPublicBranchHoliday(holiday) },
      message: BRANCH_MESSAGES.HOLIDAY_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleBranchHolidayError(error, {
      code: BRANCH_CODES.HOLIDAY_CREATE_FAILED,
      handler: "createBranchHoliday",
      message: BRANCH_MESSAGES.HOLIDAY_CREATE_FAILED,
    });
  }
}
