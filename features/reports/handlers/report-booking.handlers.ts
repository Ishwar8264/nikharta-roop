import {
  REPORT_CODES,
  REPORT_MESSAGES,
} from "@/features/reports/constants/report.constants";
import { aggregateMoney } from "@/features/reports/helpers/report.format";
import { reportJson } from "@/features/reports/responses/report.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { reportQuerySchema } from "@/schema/reports/schema.report";
import { bookingAggregate } from "./report.aggregates";
import { handleReportError } from "./report.errors";
import { resolveReportScope } from "./report.scopes";
import { parseReportQuery, requireReportAdmin } from "./report.shared";

/**
 * Handles admin booking report requests.
 */
export async function handleGetBookingReport(request: Request) {
  const auth = await requireReportAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseReportQuery(request, reportQuerySchema);
  if (!query.success) return query.error;
  try {
    const branchId = await resolveReportScope(query.data.branchId, auth.session.user);
    const report = await bookingAggregate(query.data, branchId);
    return reportJson({
      code: REPORT_CODES.BOOKING_REPORT_LOADED,
      data: {
        cancelled: report.cancelled,
        completed: report.completed,
        discountTotal: aggregateMoney(report.money._sum.discountAmount),
        noShow: report.noShow,
        total: report.count,
        totalAmount: aggregateMoney(report.money._sum.totalAmount),
      },
      message: REPORT_MESSAGES.BOOKING_REPORT_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleReportError(error, {
      code: REPORT_CODES.BOOKING_REPORT_LOAD_FAILED,
      handler: "handleGetBookingReport",
      message: REPORT_MESSAGES.BOOKING_REPORT_LOAD_FAILED,
    });
  }
}
