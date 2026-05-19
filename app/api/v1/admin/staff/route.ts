/**
 * Purpose: App Router entrypoint for admin staff collection APIs.
 * Responsibilities: expose protected staff listing and creation handlers.
 * Important notes: feature handlers own auth, validation, and branch scope checks.
 */
export const runtime = "nodejs";

export {
  handleCreateStaff as POST,
  handleListAdminStaff as GET,
} from "@/features/staff/handlers/staff-admin.handlers";
