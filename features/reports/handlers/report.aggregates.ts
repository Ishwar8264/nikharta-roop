import { BookingStatus, ProductSaleStatus } from "@prisma/client";

import { getDb } from "@/db";
import type { ReportQueryInput } from "@/schema/reports/schema.report";
import { dateOnlyRange, dateTimeRange } from "./report.scopes";

/**
 * Aggregates booking counts and service revenue for a report range.
 */
export async function bookingAggregate(input: ReportQueryInput, branchId?: string) {
  const where = { bookingDate: dateOnlyRange(input), branchId };
  const [count, completed, cancelled, noShow, money] = await Promise.all([
    getDb().booking.count({ where }),
    getDb().booking.count({ where: { ...where, status: BookingStatus.COMPLETED } }),
    getDb().booking.count({ where: { ...where, status: BookingStatus.CANCELLED } }),
    getDb().booking.count({ where: { ...where, status: BookingStatus.NO_SHOW } }),
    getDb().booking.aggregate({
      _sum: { advanceAmount: true, discountAmount: true, totalAmount: true },
      where,
    }),
  ]);
  return { cancelled, completed, count, money, noShow };
}

/**
 * Aggregates expenses for a report range.
 */
export async function expenseAggregate(input: ReportQueryInput, branchId?: string) {
  return getDb().expense.aggregate({
    _count: { _all: true },
    _sum: { amount: true },
    where: { branchId, expenseDate: dateOnlyRange(input) },
  });
}

/**
 * Aggregates completed product sales for a report range.
 */
export async function productSaleAggregate(input: ReportQueryInput, branchId?: string) {
  return getDb().productSale.aggregate({
    _count: { _all: true },
    _sum: { discountAmount: true, subtotal: true, totalAmount: true },
    where: {
      branchId,
      soldAt: dateTimeRange(input),
      status: ProductSaleStatus.COMPLETED,
    },
  });
}
