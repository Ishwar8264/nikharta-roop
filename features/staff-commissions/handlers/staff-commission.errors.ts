import {
  STAFF_COMMISSION_CODES,
  STAFF_COMMISSION_MESSAGES,
} from "@/features/staff-commissions/constants/staff-commission.constants";
import { staffCommissionError } from "@/features/staff-commissions/responses/staff-commission.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { StaffCommissionVisibleError } from "./staff-commission.shared";

/**
 * Converts expected and unexpected staff commission failures into safe responses.
 */
export function handleStaffCommissionError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof StaffCommissionVisibleError) {
    return staffCommissionError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return staffCommissionError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws a staff commission not-found error.
 */
export function throwStaffCommissionNotFound(): never {
  throw new StaffCommissionVisibleError(
    STAFF_COMMISSION_CODES.COMMISSION_NOT_FOUND,
    STAFF_COMMISSION_MESSAGES.COMMISSION_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
