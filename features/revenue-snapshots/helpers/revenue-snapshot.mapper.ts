type DecimalLike = { toString(): string };

export type RevenueSnapshotRow = {
  advanceRevenue: DecimalLike;
  bookingCount: number;
  branch: Record<string, unknown>;
  branchId: string;
  cancelledCount: number;
  completedCount: number;
  createdAt: Date;
  date: Date;
  discountTotal: DecimalLike;
  grossRevenue: DecimalLike;
  id: string;
  updatedAt: Date;
};

/**
 * Converts decimal revenue fields into API-safe string values.
 */
export function toPublicRevenueSnapshot(snapshot: RevenueSnapshotRow) {
  return {
    ...snapshot,
    advanceRevenue: snapshot.advanceRevenue.toString(),
    discountTotal: snapshot.discountTotal.toString(),
    grossRevenue: snapshot.grossRevenue.toString(),
  };
}
