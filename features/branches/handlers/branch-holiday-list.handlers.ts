import { getDb } from "@/db";
import {
  BRANCH_CODES,
  BRANCH_MESSAGES,
} from "@/features/branches/constants/branch.constants";
import { toPublicBranchHoliday } from "@/features/branches/helpers/branch-holiday.mapper";
import { branchHolidaySelect } from "@/features/branches/helpers/branch-holiday.selectors";
import { branchError, branchJson } from "@/features/branches/responses/branch.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  listBranchHolidaysQuerySchema,
  toHolidayDate,
  type ListBranchHolidaysQueryInput,
} from "@/schema/branches/schema.branch-holiday";
import { handleBranchHolidayError } from "./branch-holiday.errors";
import {
  assertCanManageHolidayBranch,
  requireBranchHolidayAdmin,
} from "./branch-holiday.shared";

/**
 * Handles admin branch holiday listing.
 */
export async function handleListBranchHolidays(request: Request, branchId: string) {
  const auth = await requireBranchHolidayAdmin(request);
  if (!auth.success) return auth.error;
  assertCanManageHolidayBranch(auth.session.user, branchId);
  const query = listBranchHolidaysQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!query.success) return branchError({
    code: BRANCH_CODES.VALIDATION_ERROR,
    message: query.error.issues[0]?.message ?? BRANCH_MESSAGES.VALIDATION_ERROR,
    status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
  });
  return listBranchHolidays(branchId, query.data);
}

async function listBranchHolidays(
  branchId: string,
  input: ListBranchHolidaysQueryInput,
) {
  try {
    const holidays = await getDb().branchHoliday.findMany({
      orderBy: [{ date: "asc" }],
      select: branchHolidaySelect(),
      take: input.limit,
      where: {
        branchId,
        date: {
          gte: input.from ? toHolidayDate(input.from) : undefined,
          lte: input.to ? toHolidayDate(input.to) : undefined,
        },
      },
    });
    return branchJson({
      code: BRANCH_CODES.HOLIDAY_LISTED,
      data: { holidays: holidays.map(toPublicBranchHoliday), limit: input.limit },
      message: BRANCH_MESSAGES.HOLIDAY_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleBranchHolidayError(error, {
      code: BRANCH_CODES.HOLIDAY_LIST_LOAD_FAILED,
      handler: "listBranchHolidays",
      message: BRANCH_MESSAGES.HOLIDAY_LIST_LOAD_FAILED,
    });
  }
}
