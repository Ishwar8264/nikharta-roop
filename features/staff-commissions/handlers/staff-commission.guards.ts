import { getDb } from "@/db";
import {
  STAFF_COMMISSION_CODES,
  STAFF_COMMISSION_MESSAGES,
} from "@/features/staff-commissions/constants/staff-commission.constants";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  StaffCommissionVisibleError,
  type StaffCommissionAdminUser,
} from "./staff-commission.shared";

/**
 * Resolves the branch scope allowed for admin commission list requests.
 */
export function resolveStaffCommissionBranch(
  requestedBranchId: string | undefined,
  admin: StaffCommissionAdminUser,
) {
  if (admin.role === "SUPER_ADMIN") return requestedBranchId;
  if (admin.branchId && (!requestedBranchId || requestedBranchId === admin.branchId)) {
    return admin.branchId;
  }
  throwForbidden();
}

/**
 * Loads a staff profile and verifies the admin can manage its branch.
 */
export async function loadManageableCommissionStaff(
  staffId: string,
  admin: StaffCommissionAdminUser,
) {
  const staff = await getDb().staff.findUnique({
    select: { branchId: true, id: true },
    where: { id: staffId },
  });
  if (!staff) throwStaffNotFound();
  assertCanManageCommissionBranch(admin, staff.branchId);
  return staff;
}

/**
 * Loads one commission and validates branch ownership through staff.
 */
export async function loadManageableStaffCommission(
  commissionId: string,
  admin: StaffCommissionAdminUser,
) {
  const commission = await getDb().staffCommission.findUnique({
    select: { id: true, staff: { select: { branchId: true } } },
    where: { id: commissionId },
  });
  if (!commission) return null;
  assertCanManageCommissionBranch(admin, commission.staff.branchId);
  return commission;
}

/**
 * Ensures branch admins only manage their assigned branch.
 */
function assertCanManageCommissionBranch(admin: StaffCommissionAdminUser, branchId: string) {
  if (admin.role === "SUPER_ADMIN" || admin.branchId === branchId) return;
  throwForbidden();
}

/**
 * Throws a branch-scope authorization error.
 */
function throwForbidden(): never {
  throw new StaffCommissionVisibleError(
    STAFF_COMMISSION_CODES.FORBIDDEN,
    STAFF_COMMISSION_MESSAGES.FORBIDDEN,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Throws when the target staff profile cannot be used.
 */
function throwStaffNotFound(): never {
  throw new StaffCommissionVisibleError(
    STAFF_COMMISSION_CODES.STAFF_NOT_FOUND,
    STAFF_COMMISSION_MESSAGES.STAFF_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
