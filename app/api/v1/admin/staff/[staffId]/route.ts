/**
 * Purpose: App Router entrypoint for one admin staff profile.
 * Responsibilities: expose protected staff detail loading and profile updates.
 * Important notes: feature handlers own auth, validation, and branch scope checks.
 */
import {
  handleGetAdminStaff,
  handleUpdateStaff,
} from "@/features/staff/handlers/staff-admin.handlers";

export const runtime = "nodejs";

type AdminStaffRouteContext = { params: Promise<{ staffId: string }> };

export async function GET(request: Request, context: AdminStaffRouteContext) {
  const { staffId } = await context.params;
  return handleGetAdminStaff(request, staffId);
}

export async function PATCH(request: Request, context: AdminStaffRouteContext) {
  const { staffId } = await context.params;
  return handleUpdateStaff(request, staffId);
}
