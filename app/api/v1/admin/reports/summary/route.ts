export const runtime = "nodejs";

/**
 * Routes admin report summary requests to the reports feature handler.
 */
export { handleGetReportSummary as GET } from "@/features/reports/handlers/report.handlers";
