import { reportError } from "@/features/reports/responses/report.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { ReportVisibleError } from "./report.shared";

/**
 * Converts expected and unexpected report failures into safe responses.
 */
export function handleReportError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof ReportVisibleError) {
    return reportError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return reportError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}
