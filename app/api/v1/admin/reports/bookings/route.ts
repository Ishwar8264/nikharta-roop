export const runtime = "nodejs";

/**
 * Routes admin booking report requests to the reports feature handler.
 */
export { handleGetBookingReport as GET } from "@/features/reports/handlers/report.handlers";
