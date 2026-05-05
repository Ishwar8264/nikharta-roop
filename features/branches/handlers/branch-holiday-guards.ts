import { getDb } from "@/db";
import {
  BRANCH_CODES,
  BRANCH_MESSAGES,
} from "@/features/branches/constants/branch.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { BranchHolidayVisibleError } from "./branch-holiday.shared";

/**
 * Ensures a holiday belongs to the branch from the route path.
 */
export async function assertHolidayBelongsToBranch(
  holidayId: string,
  branchId: string,
) {
  const holiday = await getDb().branchHoliday.findFirst({
    select: { id: true },
    where: { branchId, id: holidayId },
  });
  if (!holiday) {
    throw new BranchHolidayVisibleError(
      BRANCH_CODES.HOLIDAY_NOT_FOUND,
      BRANCH_MESSAGES.HOLIDAY_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
}
