import { handleUpdateStaffCommission } from "@/features/staff-commissions/handlers/staff-commission.handlers";

export const runtime = "nodejs";

type AdminStaffCommissionRouteContext = {
  params: Promise<{ commissionId: string }>;
};

/**
 * Routes admin staff commission patch requests to the feature handler.
 */
export async function PATCH(
  request: Request,
  context: AdminStaffCommissionRouteContext,
) {
  const { commissionId } = await context.params;
  return handleUpdateStaffCommission(request, commissionId);
}
