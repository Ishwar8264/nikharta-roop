import type { ZodType } from "zod";

import {
  STAFF_COMMISSION_CODES,
  STAFF_COMMISSION_MESSAGES,
} from "@/features/staff-commissions/constants/staff-commission.constants";
import type { StaffCommissionRow } from "@/features/staff-commissions/helpers/staff-commission.mapper";
import { toPublicStaffCommission } from "@/features/staff-commissions/helpers/staff-commission.mapper";
import { staffCommissionError, staffCommissionJson } from "@/features/staff-commissions/responses/staff-commission.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses staff commission query strings with feature-owned validation errors.
 */
export function parseStaffCommissionQuery<T>(request: Request, schema: ZodType<T>) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (parsed.success) return { data: parsed.data, success: true as const };
  return {
    error: staffCommissionError({
      code: STAFF_COMMISSION_CODES.VALIDATION_ERROR,
      message: STAFF_COMMISSION_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps a staff commission collection in the shared response shape.
 */
export function staffCommissionListResponse(
  commissions: StaffCommissionRow[],
  limit: number,
) {
  return staffCommissionJson({
    code: STAFF_COMMISSION_CODES.COMMISSION_LISTED,
    data: { commissions: commissions.map(toPublicStaffCommission), limit },
    message: STAFF_COMMISSION_MESSAGES.COMMISSION_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
