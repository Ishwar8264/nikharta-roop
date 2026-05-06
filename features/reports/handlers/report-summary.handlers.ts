import {
  REPORT_CODES,
  REPORT_MESSAGES,
} from "@/features/reports/constants/report.constants";
import { aggregateMoney } from "@/features/reports/helpers/report.format";
import { reportJson } from "@/features/reports/responses/report.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { reportQuerySchema } from "@/schema/reports/schema.report";
import {
  bookingAggregate,
  expenseAggregate,
  productSaleAggregate,
} from "./report.aggregates";
import { handleReportError } from "./report.errors";
import { resolveReportScope } from "./report.scopes";
import { parseReportQuery, requireReportAdmin } from "./report.shared";

/**
 * Handles admin business summary report requests.
 */
export async function handleGetReportSummary(request: Request) {
  const auth = await requireReportAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseReportQuery(request, reportQuerySchema);
  if (!query.success) return query.error;
  try {
    const branchId = await resolveReportScope(query.data.branchId, auth.session.user);
    const [bookings, expenses, productSales] = await Promise.all([
      bookingAggregate(query.data, branchId),
      expenseAggregate(query.data, branchId),
      productSaleAggregate(query.data, branchId),
    ]);
    return reportJson({
      code: REPORT_CODES.SUMMARY_LOADED,
      data: {
        bookings: {
          cancelled: bookings.cancelled,
          completed: bookings.completed,
          noShow: bookings.noShow,
          total: bookings.count,
        },
        expenses: {
          total: aggregateMoney(expenses._sum.amount),
          totalCount: expenses._count._all,
        },
        productSales: {
          total: aggregateMoney(productSales._sum.totalAmount),
          totalCount: productSales._count._all,
        },
        revenue: {
          bookingTotal: aggregateMoney(bookings.money._sum.totalAmount),
          productTotal: aggregateMoney(productSales._sum.totalAmount),
        },
      },
      message: REPORT_MESSAGES.SUMMARY_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleReportError(error, {
      code: REPORT_CODES.SUMMARY_LOAD_FAILED,
      handler: "handleGetReportSummary",
      message: REPORT_MESSAGES.SUMMARY_LOAD_FAILED,
    });
  }
}
