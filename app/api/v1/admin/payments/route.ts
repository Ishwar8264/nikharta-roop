export const runtime = "nodejs";

/**
 * Routes admin payment listing requests to feature handlers.
 */
export { handleListAdminPayments as GET } from "@/features/admin-payments/handlers/admin-payment.handlers";
