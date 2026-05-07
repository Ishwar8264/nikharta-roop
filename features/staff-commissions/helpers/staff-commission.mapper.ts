type DecimalLike = { toString(): string };

export type StaffCommissionRow = {
  baseAmount: DecimalLike;
  booking: Record<string, unknown> | null;
  bookingId: string | null;
  commissionAmount: DecimalLike;
  commissionRate: DecimalLike | null;
  createdAt: Date;
  id: string;
  paidAt: Date | null;
  productSale: Record<string, unknown> | null;
  productSaleId: string | null;
  staff: Record<string, unknown>;
  staffId: string;
  status: string;
  updatedAt: Date;
};

/**
 * Converts decimal commission fields into API-safe string values.
 */
export function toPublicStaffCommission(commission: StaffCommissionRow) {
  return {
    ...commission,
    baseAmount: commission.baseAmount.toString(),
    commissionAmount: commission.commissionAmount.toString(),
    commissionRate: commission.commissionRate?.toString() ?? null,
  };
}
