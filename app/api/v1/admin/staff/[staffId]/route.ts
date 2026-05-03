import { handleUpdateStaff } from "@/features/staff/handlers/staff-admin.handlers";

export const runtime = "nodejs";

type AdminStaffRouteContext = { params: Promise<{ staffId: string }> };

export async function PATCH(request: Request, context: AdminStaffRouteContext) {
  const { staffId } = await context.params;
  return handleUpdateStaff(request, staffId);
}
