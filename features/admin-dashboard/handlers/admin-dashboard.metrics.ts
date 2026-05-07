import { BookingStatus, ProductSaleStatus } from "@prisma/client";

import { getDb } from "@/db";
import { aggregateMoney } from "@/features/reports/helpers/report.format";

/**
 * Loads today-focused dashboard metrics for one branch scope.
 */
export async function dashboardMetrics(branchId: string | undefined) {
  const today = todayRanges();
  const [bookings, revenue, products, staffAvailable] = await Promise.all([
    bookingCounts(branchId, today),
    bookingRevenue(branchId, today),
    productRevenue(branchId, today),
    getDb().staff.count({ where: { branchId, isAvailable: true } }),
  ]);
  return {
    bookings,
    revenue: { ...revenue, ...products },
    staff: { available: staffAvailable },
  };
}

/**
 * Aggregates today's booking status counts.
 */
async function bookingCounts(branchId: string | undefined, today: TodayRanges) {
  const where = { bookingDate: today.dateOnly, branchId };
  const [total, pending, confirmed, cancelled] = await Promise.all([
    getDb().booking.count({ where }),
    getDb().booking.count({ where: { ...where, status: BookingStatus.PENDING } }),
    getDb().booking.count({ where: { ...where, status: BookingStatus.CONFIRMED } }),
    getDb().booking.count({ where: { ...where, status: BookingStatus.CANCELLED } }),
  ]);
  return { cancelled, confirmed, pending, total };
}

/**
 * Aggregates today's booking revenue.
 */
async function bookingRevenue(branchId: string | undefined, today: TodayRanges) {
  const result = await getDb().booking.aggregate({
    _sum: { advanceAmount: true, discountAmount: true, totalAmount: true },
    where: { bookingDate: today.dateOnly, branchId },
  });
  return {
    advance: aggregateMoney(result._sum.advanceAmount),
    bookingTotal: aggregateMoney(result._sum.totalAmount),
    discount: aggregateMoney(result._sum.discountAmount),
  };
}

/**
 * Aggregates today's completed product revenue.
 */
async function productRevenue(branchId: string | undefined, today: TodayRanges) {
  const result = await getDb().productSale.aggregate({
    _sum: { totalAmount: true },
    where: {
      branchId,
      soldAt: today.dateTime,
      status: ProductSaleStatus.COMPLETED,
    },
  });
  return { productTotal: aggregateMoney(result._sum.totalAmount) };
}

/**
 * Builds the current UTC day ranges used by dashboard metrics.
 */
function todayRanges(): TodayRanges {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const end = new Date(from.getTime() + 24 * 60 * 60 * 1000 - 1);
  return {
    dateOnly: { gte: from, lte: from },
    dateTime: { gte: from, lte: end },
  };
}

type TodayRanges = {
  dateOnly: { gte: Date; lte: Date };
  dateTime: { gte: Date; lte: Date };
};
