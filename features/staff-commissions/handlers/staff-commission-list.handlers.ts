import { getDb } from "@/db";
import {
  STAFF_COMMISSION_CODES,
  STAFF_COMMISSION_MESSAGES,
} from "@/features/staff-commissions/constants/staff-commission.constants";
import { staffCommissionSelect } from "@/features/staff-commissions/helpers/staff-commission.selectors";
import {
  listStaffCommissionsQuerySchema,
  type ListStaffCommissionsQueryInput,
} from "@/schema/staff-commissions/schema.staff-commission";
import { handleStaffCommissionError } from "./staff-commission.errors";
import { resolveStaffCommissionBranch } from "./staff-commission.guards";
import {
  parseStaffCommissionQuery,
  staffCommissionListResponse,
} from "./staff-commission-list.shared";
import {
  requireStaffCommissionAdmin,
  type StaffCommissionAdminUser,
} from "./staff-commission.shared";

/**
 * Handles admin staff commission listing requests.
 */
export async function handleListStaffCommissions(request: Request) {
  const auth = await requireStaffCommissionAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseStaffCommissionQuery(request, listStaffCommissionsQuerySchema);
  if (!query.success) return query.error;
  return listStaffCommissions(query.data, auth.session.user);
}

/**
 * Lists staff commissions with branch-admin scoping and date filters.
 */
async function listStaffCommissions(
  input: ListStaffCommissionsQueryInput,
  admin: StaffCommissionAdminUser,
) {
  try {
    const branchId = resolveStaffCommissionBranch(input.branchId, admin);
    const commissions = await getDb().staffCommission.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: staffCommissionSelect(),
      take: input.limit,
      where: {
        bookingId: input.bookingId,
        createdAt: createdAtRange(input),
        productSaleId: input.productSaleId,
        staff: branchId ? { branchId } : undefined,
        staffId: input.staffId,
        status: input.status,
      },
    });
    return staffCommissionListResponse(commissions, input.limit);
  } catch (error) {
    return handleStaffCommissionError(error, {
      code: STAFF_COMMISSION_CODES.COMMISSION_LOAD_FAILED,
      handler: "listStaffCommissions",
      message: STAFF_COMMISSION_MESSAGES.COMMISSION_LOAD_FAILED,
    });
  }
}

/**
 * Builds optional commission created-at range filters.
 */
function createdAtRange(input: ListStaffCommissionsQueryInput) {
  return {
    gte: input.from ? new Date(`${input.from}T00:00:00.000Z`) : undefined,
    lte: input.to ? new Date(`${input.to}T23:59:59.999Z`) : undefined,
  };
}
