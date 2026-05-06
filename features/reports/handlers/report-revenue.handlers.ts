import { getDb } from "@/db";
import {
  REPORT_CODES,
  REPORT_MESSAGES,
} from "@/features/reports/constants/report.constants";
import { aggregateMoney } from "@/features/reports/helpers/report.format";
import { reportJson } from "@/features/reports/responses/report.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { reportQuerySchema } from "@/schema/reports/schema.report";
import { bookingAggregate, productSaleAggregate } from "./report.aggregates";
import { handleReportError } from "./report.errors";
import { dateOnlyRange, resolveReportScope } from "./report.scopes";
import { parseReportQuery, requireReportAdmin } from "./report.shared";

/**
 * Handles admin revenue report requests.
 */
export async function handleGetRevenueReport(request: Request) {
  const auth = await requireReportAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseReportQuery(request, reportQuerySchema);
  if (!query.success) return query.error;
  try {
    const branchId = await resolveReportScope(query.data.branchId, auth.session.user);
    const [bookings, products, snapshots] = await Promise.all([
      bookingAggregate(query.data, branchId),
      productSaleAggregate(query.data, branchId),
      getDb().revenueSnapshot.findMany({
        orderBy: [{ date: "asc" }],
        where: { branchId, date: dateOnlyRange(query.data) },
      }),
    ]);
    return reportJson({
      code: REPORT_CODES.REVENUE_REPORT_LOADED,
      data: {
        bookingRevenue: aggregateMoney(bookings.money._sum.totalAmount),
        productRevenue: aggregateMoney(products._sum.totalAmount),
        snapshots,
      },
      message: REPORT_MESSAGES.REVENUE_REPORT_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleReportError(error, {
      code: REPORT_CODES.REVENUE_REPORT_LOAD_FAILED,
      handler: "handleGetRevenueReport",
      message: REPORT_MESSAGES.REVENUE_REPORT_LOAD_FAILED,
    });
  }
}
