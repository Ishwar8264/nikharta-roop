export const runtime = "nodejs";

/**
 * Routes admin staff commission list and create requests to feature handlers.
 */
export {
  handleCreateStaffCommission as POST,
  handleListStaffCommissions as GET,
} from "@/features/staff-commissions/handlers/staff-commission.handlers";
