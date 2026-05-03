import { handleGetStaff } from "@/features/staff/handlers/staff.handlers";

export const runtime = "nodejs";

type StaffRouteContext = {
  params: Promise<{ staffId: string }>;
};

/**
 * Routes public staff detail requests to the staff handler.
 */
export async function GET(request: Request, context: StaffRouteContext) {
  const { staffId } = await context.params;

  return handleGetStaff(request, staffId);
}
