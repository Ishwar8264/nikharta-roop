export const runtime = "nodejs";

/**
 * Routes admin expense report requests to the reports feature handler.
 */
export { handleGetExpenseReport as GET } from "@/features/reports/handlers/report.handlers";
