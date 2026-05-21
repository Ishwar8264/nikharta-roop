/**
 * Purpose: Admin staff commission write handlers.
 * Responsibilities: authenticate admins, validate staff/source ownership, and create or update commission records.
 * Important notes: commission creation waits for staff and source checks before writing money records.
 */
import { getDb } from "@/db";
import {
  STAFF_COMMISSION_CODES,
  STAFF_COMMISSION_MESSAGES,
} from "@/features/staff-commissions/constants/staff-commission.constants";
import { staffCommissionSelect } from "@/features/staff-commissions/helpers/staff-commission.selectors";
import {
  createStaffCommissionSchema,
  updateStaffCommissionSchema,
  type CreateStaffCommissionInput,
  type UpdateStaffCommissionInput,
} from "@/schema/staff-commissions/schema.staff-commission";
import { handleStaffCommissionError, throwStaffCommissionNotFound } from "./staff-commission.errors";
import {
  loadManageableCommissionStaff,
  loadManageableStaffCommission,
} from "./staff-commission.guards";
import { assertCommissionSource } from "./staff-commission-source.guards";
import {
  parseStaffCommissionBody,
  requireStaffCommissionAdmin,
  type StaffCommissionAdminUser,
} from "./staff-commission.shared";
import { createCommissionData, updateCommissionData } from "./staff-commission-write.helpers";
import { staffCommissionWriteResponse } from "./staff-commission-write.responses";

/**
 * Handles admin staff commission creation requests.
 */
export async function handleCreateStaffCommission(request: Request) {
  const auth = await requireStaffCommissionAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseStaffCommissionBody(request, createStaffCommissionSchema);
  if (body.error) return body.error;
  return createStaffCommission(body.data, auth.session.user);
}

/**
 * Handles admin staff commission patch requests.
 */
export async function handleUpdateStaffCommission(request: Request, commissionId: string) {
  const auth = await requireStaffCommissionAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseStaffCommissionBody(request, updateStaffCommissionSchema);
  if (body.error) return body.error;
  return updateStaffCommission(commissionId, body.data, auth.session.user);
}

/**
 * Creates one commission after staff and source ownership validation.
 */
async function createStaffCommission(
  input: CreateStaffCommissionInput,
  admin: StaffCommissionAdminUser,
) {
  try {
    // Commission writes must wait until staff branch and source ownership validation pass.
    // react-doctor-disable-next-line react-doctor/async-parallel
    const staff = await loadManageableCommissionStaff(input.staffId, admin);
    await assertCommissionSource({ ...input, branchId: staff.branchId });
    const commission = await getDb().staffCommission.create({
      data: createCommissionData(input),
      select: staffCommissionSelect(),
    });
    return staffCommissionWriteResponse(commission, STAFF_COMMISSION_CODES.COMMISSION_CREATED);
  } catch (error) {
    return handleStaffCommissionError(error, {
      code: STAFF_COMMISSION_CODES.COMMISSION_CREATE_FAILED,
      handler: "createStaffCommission",
      message: STAFF_COMMISSION_MESSAGES.COMMISSION_CREATE_FAILED,
    });
  }
}

/**
 * Updates one commission while preserving original staff and source links.
 */
async function updateStaffCommission(
  commissionId: string,
  input: UpdateStaffCommissionInput,
  admin: StaffCommissionAdminUser,
) {
  try {
    const current = await loadManageableStaffCommission(commissionId, admin);
    if (!current) throwStaffCommissionNotFound();
    const commission = await getDb().staffCommission.update({
      data: updateCommissionData(input),
      select: staffCommissionSelect(),
      where: { id: commissionId },
    });
    return staffCommissionWriteResponse(commission, STAFF_COMMISSION_CODES.COMMISSION_UPDATED);
  } catch (error) {
    return handleStaffCommissionError(error, {
      code: STAFF_COMMISSION_CODES.COMMISSION_UPDATE_FAILED,
      handler: "updateStaffCommission",
      message: STAFF_COMMISSION_MESSAGES.COMMISSION_UPDATE_FAILED,
    });
  }
}
