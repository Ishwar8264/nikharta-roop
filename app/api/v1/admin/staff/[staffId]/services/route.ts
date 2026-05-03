import { handleAssignStaffService } from "@/features/staff/handlers/staff-service-admin.handlers";

export const runtime = "nodejs";

type AdminStaffRouteContext = { params: Promise<{ staffId: string }> };

export async function POST(request: Request, context: AdminStaffRouteContext) {
  const { staffId } = await context.params;
  return handleAssignStaffService(request, staffId);
}
