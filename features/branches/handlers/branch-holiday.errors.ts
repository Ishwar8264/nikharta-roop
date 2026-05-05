import {
  BRANCH_CODES,
  BRANCH_MESSAGES,
} from "@/features/branches/constants/branch.constants";
import { branchError } from "@/features/branches/responses/branch.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { BranchHolidayVisibleError } from "./branch-holiday.shared";

/**
 * Converts expected holiday failures into user-safe branch responses.
 */
export function handleBranchHolidayError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof BranchHolidayVisibleError) {
    return branchError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  if (isUniqueError(error)) {
    return branchError({
      code: BRANCH_CODES.HOLIDAY_DUPLICATE,
      message: BRANCH_MESSAGES.HOLIDAY_DUPLICATE,
      status: HTTP_STATUS.CONFLICT,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return branchError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Detects Prisma unique constraint failures for branch/date duplicates.
 */
function isUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}
