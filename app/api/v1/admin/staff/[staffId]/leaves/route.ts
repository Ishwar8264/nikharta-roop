import { handleCreateStaffLeave } from "@/features/staff/handlers/staff-leave-admin.handlers";

export const runtime = "nodejs";

type AdminStaffRouteContext = { params: Promise<{ staffId: string }> };

export async function POST(request: Request, context: AdminStaffRouteContext) {
  const { staffId } = await context.params;
  return handleCreateStaffLeave(request, staffId);
}
