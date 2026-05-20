/**
 * Purpose: App Router entrypoint for admin package collection APIs.
 * Responsibilities: expose protected package listing and creation handlers.
 * Important notes: feature handlers own auth, validation, and branch scope checks.
 */
export const runtime = "nodejs";

export {
  handleCreateAdminPackage as POST,
  handleListAdminPackages as GET,
} from "@/features/packages/handlers/package.handlers";
