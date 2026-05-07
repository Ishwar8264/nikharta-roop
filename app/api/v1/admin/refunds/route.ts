export const runtime = "nodejs";

/**
 * Routes admin refund listing requests to the refunds feature handler.
 */
export { handleListRefunds as GET } from "@/features/refunds/handlers/refund.handlers";
