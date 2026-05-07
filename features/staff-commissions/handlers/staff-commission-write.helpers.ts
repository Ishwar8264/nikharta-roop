import type {
  CreateStaffCommissionInput,
  UpdateStaffCommissionInput,
} from "@/schema/staff-commissions/schema.staff-commission";

/**
 * Builds Prisma data for commission creation with calculated amount fallback.
 */
export function createCommissionData(input: CreateStaffCommissionInput) {
  return {
    baseAmount: input.baseAmount,
    bookingId: input.bookingId,
    commissionAmount: commissionAmount(input),
    commissionRate: input.commissionRate,
    paidAt: paidAtForStatus(input),
    productSaleId: input.productSaleId,
    staffId: input.staffId,
    status: input.status,
  };
}

/**
 * Builds Prisma data for commission patch updates.
 */
export function updateCommissionData(input: UpdateStaffCommissionInput) {
  return {
    baseAmount: input.baseAmount,
    commissionAmount: updateCommissionAmount(input),
    commissionRate: input.commissionRate,
    paidAt: paidAtForStatus(input),
    status: input.status,
  };
}

/**
 * Calculates commission amount from rate when explicit amount is omitted.
 */
function commissionAmount(input: {
  baseAmount: number;
  commissionAmount?: number;
  commissionRate?: number | null;
}) {
  if (input.commissionAmount !== undefined) return input.commissionAmount;
  return Number(((input.baseAmount * (input.commissionRate ?? 0)) / 100).toFixed(2));
}

/**
 * Calculates update amount only when enough fields are present.
 */
function updateCommissionAmount(input: UpdateStaffCommissionInput) {
  if (input.commissionAmount !== undefined) return input.commissionAmount;
  if (input.baseAmount !== undefined && input.commissionRate != null) {
    return commissionAmount({
      baseAmount: input.baseAmount,
      commissionRate: input.commissionRate,
    });
  }
  return undefined;
}

/**
 * Defaults paidAt when status moves to PAID and caller omitted paidAt.
 */
function paidAtForStatus(input: { paidAt?: Date | null; status?: string }) {
  if (input.paidAt !== undefined) return input.paidAt;
  return input.status === "PAID" ? new Date() : undefined;
}
