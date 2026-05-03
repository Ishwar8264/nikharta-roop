import { getDb } from "@/db";
import { STAFF_CODES, STAFF_MESSAGES } from "@/features/staff/constants/staff.constants";
import { staffJson } from "@/features/staff/responses/staff.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createStaffLeaveSchema,
  updateStaffLeaveSchema,
} from "@/schema/staff/schema.staff";
import {
  assertManageableStaff,
  handleStaffWriteError,
  parseStaffJsonBody,
  requireStaffAdmin,
  type StaffAdminUser,
} from "./staff-admin.shared";

export async function handleCreateStaffLeave(request: Request, staffId: string) {
  const auth = await requireStaffAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseStaffJsonBody(request, createStaffLeaveSchema);
  if (body.error) return body.error;
  return createStaffLeave(staffId, body.data, auth.session.user);
}

export async function handleUpdateStaffLeave(request: Request, staffId: string, leaveId: string) {
  const auth = await requireStaffAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseStaffJsonBody(request, updateStaffLeaveSchema);
  if (body.error) return body.error;
  return updateStaffLeave(staffId, leaveId, body.data, auth.session.user);
}

async function createStaffLeave(staffId: string, input: { startsAt: Date; endsAt: Date; reason?: string | null }, admin: StaffAdminUser) {
  try {
    await assertManageableStaff(staffId, admin);
    const leave = await getDb().staffLeave.create({
      data: { endsAt: input.endsAt, reason: input.reason ?? null, staffId, startsAt: input.startsAt },
    });
    return staffJson({ code: STAFF_CODES.LEAVE_CREATED, data: { leave }, message: STAFF_MESSAGES.LEAVE_CREATED, status: HTTP_STATUS.CREATED, success: true });
  } catch (error) {
    return handleStaffWriteError(error, STAFF_CODES.LEAVE_CREATE_FAILED, STAFF_MESSAGES.LEAVE_CREATE_FAILED);
  }
}

async function updateStaffLeave(staffId: string, leaveId: string, input: { startsAt?: Date; endsAt?: Date; reason?: string | null }, admin: StaffAdminUser) {
  try {
    await assertManageableStaff(staffId, admin);
    const leave = await getDb().staffLeave.update({
      data: { endsAt: input.endsAt, reason: input.reason, startsAt: input.startsAt },
      where: { id: leaveId, staffId },
    });
    return staffJson({ code: STAFF_CODES.LEAVE_UPDATED, data: { leave }, message: STAFF_MESSAGES.LEAVE_UPDATED, status: HTTP_STATUS.OK, success: true });
  } catch (error) {
    return handleStaffWriteError(error, STAFF_CODES.LEAVE_UPDATE_FAILED, STAFF_MESSAGES.LEAVE_UPDATE_FAILED);
  }
}
