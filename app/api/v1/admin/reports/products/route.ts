export const runtime = "nodejs";

/**
 * Routes admin product report requests to the reports feature handler.
 */
export { handleGetProductReport as GET } from "@/features/reports/handlers/report.handlers";
