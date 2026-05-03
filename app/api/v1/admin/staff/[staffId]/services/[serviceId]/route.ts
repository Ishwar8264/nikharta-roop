import { handleRemoveStaffService } from "@/features/staff/handlers/staff-service-admin.handlers";

export const runtime = "nodejs";

type AdminStaffRouteContext = {
  params: Promise<{ serviceId: string; staffId: string }>;
};

export async function DELETE(request: Request, context: AdminStaffRouteContext) {
  const { serviceId, staffId } = await context.params;
  return handleRemoveStaffService(request, staffId, serviceId);
}
