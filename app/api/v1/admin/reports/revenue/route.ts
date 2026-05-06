export const runtime = "nodejs";

/**
 * Routes admin revenue report requests to the reports feature handler.
 */
export { handleGetRevenueReport as GET } from "@/features/reports/handlers/report.handlers";
