import { handleUpdateStaffLeave } from "@/features/staff/handlers/staff-leave-admin.handlers";

export const runtime = "nodejs";

type AdminStaffRouteContext = {
  params: Promise<{ leaveId: string; staffId: string }>;
};

export async function PATCH(request: Request, context: AdminStaffRouteContext) {
  const { leaveId, staffId } = await context.params;
  return handleUpdateStaffLeave(request, staffId, leaveId);
}
