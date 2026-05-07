import { getDb } from "@/db";
import {
  STAFF_COMMISSION_CODES,
  STAFF_COMMISSION_MESSAGES,
} from "@/features/staff-commissions/constants/staff-commission.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { StaffCommissionVisibleError } from "./staff-commission.shared";

/**
 * Ensures linked booking or product sale belongs to the same branch and staff.
 */
export async function assertCommissionSource(input: {
  bookingId?: string;
  branchId: string;
  productSaleId?: string;
  staffId: string;
}) {
  if (input.bookingId) await assertBookingSource(input.bookingId, input.branchId, input.staffId);
  if (input.productSaleId) await assertProductSaleSource(input.productSaleId, input.branchId);
}

/**
 * Verifies booking source branch and assigned staff match commission input.
 */
async function assertBookingSource(bookingId: string, branchId: string, staffId: string) {
  const booking = await getDb().booking.findUnique({
    select: { branchId: true, id: true, staffId: true },
    where: { id: bookingId },
  });
  if (booking?.branchId === branchId && booking.staffId === staffId) return;
  throwSourceNotFound();
}

/**
 * Verifies product sale source branch matches commission staff branch.
 */
async function assertProductSaleSource(productSaleId: string, branchId: string) {
  const sale = await getDb().productSale.findUnique({
    select: { branchId: true, id: true },
    where: { id: productSaleId },
  });
  if (sale?.branchId === branchId) return;
  throwSourceNotFound();
}

/**
 * Throws when a linked commission source cannot be used.
 */
function throwSourceNotFound(): never {
  throw new StaffCommissionVisibleError(
    STAFF_COMMISSION_CODES.SOURCE_NOT_FOUND,
    STAFF_COMMISSION_MESSAGES.SOURCE_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
