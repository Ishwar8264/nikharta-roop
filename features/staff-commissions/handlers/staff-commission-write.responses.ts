import {
  STAFF_COMMISSION_CODES,
  STAFF_COMMISSION_MESSAGES,
} from "@/features/staff-commissions/constants/staff-commission.constants";
import { toPublicStaffCommission } from "@/features/staff-commissions/helpers/staff-commission.mapper";
import { staffCommissionJson } from "@/features/staff-commissions/responses/staff-commission.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Wraps a staff commission write result in the shared response shape.
 */
export function staffCommissionWriteResponse(
  commission: Parameters<typeof toPublicStaffCommission>[0],
  code: string,
) {
  const created = code === STAFF_COMMISSION_CODES.COMMISSION_CREATED;
  return staffCommissionJson({
    code,
    data: { commission: toPublicStaffCommission(commission) },
    message: created
      ? STAFF_COMMISSION_MESSAGES.COMMISSION_CREATED
      : STAFF_COMMISSION_MESSAGES.COMMISSION_UPDATED,
    status: created ? HTTP_STATUS.CREATED : HTTP_STATUS.OK,
    success: true,
  });
}
