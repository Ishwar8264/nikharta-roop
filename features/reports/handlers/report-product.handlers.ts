import {
  REPORT_CODES,
  REPORT_MESSAGES,
} from "@/features/reports/constants/report.constants";
import { aggregateMoney } from "@/features/reports/helpers/report.format";
import { reportJson } from "@/features/reports/responses/report.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { reportQuerySchema } from "@/schema/reports/schema.report";
import { productSaleAggregate } from "./report.aggregates";
import { handleReportError } from "./report.errors";
import { resolveReportScope } from "./report.scopes";
import { parseReportQuery, requireReportAdmin } from "./report.shared";

/**
 * Handles admin product sales report requests.
 */
export async function handleGetProductReport(request: Request) {
  const auth = await requireReportAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseReportQuery(request, reportQuerySchema);
  if (!query.success) return query.error;
  try {
    const branchId = await resolveReportScope(query.data.branchId, auth.session.user);
    const report = await productSaleAggregate(query.data, branchId);
    return reportJson({
      code: REPORT_CODES.PRODUCT_REPORT_LOADED,
      data: {
        discountTotal: aggregateMoney(report._sum.discountAmount),
        subtotal: aggregateMoney(report._sum.subtotal),
        total: aggregateMoney(report._sum.totalAmount),
        totalCount: report._count._all,
      },
      message: REPORT_MESSAGES.PRODUCT_REPORT_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleReportError(error, {
      code: REPORT_CODES.PRODUCT_REPORT_LOAD_FAILED,
      handler: "handleGetProductReport",
      message: REPORT_MESSAGES.PRODUCT_REPORT_LOAD_FAILED,
    });
  }
}
