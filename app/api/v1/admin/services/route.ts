/**
 * Purpose: App Router entrypoint for admin service collection APIs.
 * Responsibilities: expose listing and creation through the service feature handlers.
 * Important notes: feature handlers own authentication, validation, and branch scope checks.
 */
export const runtime = "nodejs";

export {
  handleCreateAdminService as POST,
  handleListAdminServices as GET,
} from "@/features/services/handlers/service-admin.handlers";
