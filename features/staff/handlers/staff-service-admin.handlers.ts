import { getDb } from "@/db";
import { STAFF_CODES, STAFF_MESSAGES } from "@/features/staff/constants/staff.constants";
import { toPublicStaff } from "@/features/staff/helpers/staff.mapper";
import { staffSelect } from "@/features/staff/helpers/staff.selectors";
import { staffJson } from "@/features/staff/responses/staff.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { assignStaffServiceSchema } from "@/schema/staff/schema.staff";
import {
  assertManageableStaff,
  handleStaffWriteError,
  parseStaffJsonBody,
  requireStaffAdmin,
  type StaffAdminUser,
  StaffVisibleError,
} from "./staff-admin.shared";

export async function handleAssignStaffService(request: Request, staffId: string) {
  const auth = await requireStaffAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseStaffJsonBody(request, assignStaffServiceSchema);
  if (body.error) return body.error;
  return assignStaffService(staffId, body.data.serviceId, auth.session.user);
}

export async function handleRemoveStaffService(request: Request, staffId: string, serviceId: string) {
  const auth = await requireStaffAdmin(request);
  if (!auth.success) return auth.error;
  return removeStaffService(staffId, serviceId, auth.session.user);
}

async function assignStaffService(staffId: string, serviceId: string, admin: StaffAdminUser) {
  try {
    const staff = await assertManageableStaff(staffId, admin);
    await assertService(staff.branchId, serviceId);
    await getDb().staffService.upsert({
      create: { serviceId, staffId },
      update: {},
      where: { staffId_serviceId: { serviceId, staffId } },
    });
    return staffResponse(staffId, STAFF_CODES.SERVICE_ASSIGNED, STAFF_MESSAGES.SERVICE_ASSIGNED);
  } catch (error) {
    return handleStaffWriteError(error, STAFF_CODES.SERVICE_UPDATE_FAILED, STAFF_MESSAGES.SERVICE_UPDATE_FAILED);
  }
}

async function removeStaffService(staffId: string, serviceId: string, admin: StaffAdminUser) {
  try {
    await assertManageableStaff(staffId, admin);
    await getDb().staffService.delete({ where: { staffId_serviceId: { serviceId, staffId } } });
    return staffResponse(staffId, STAFF_CODES.SERVICE_REMOVED, STAFF_MESSAGES.SERVICE_REMOVED);
  } catch (error) {
    return handleStaffWriteError(error, STAFF_CODES.SERVICE_UPDATE_FAILED, STAFF_MESSAGES.SERVICE_UPDATE_FAILED);
  }
}

async function assertService(branchId: string, serviceId: string) {
  const service = await getDb().service.findFirst({ select: { id: true }, where: { branchId, id: serviceId, isActive: true } });
  if (!service) throw new StaffVisibleError(STAFF_CODES.SERVICE_NOT_FOUND, STAFF_MESSAGES.SERVICE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
}

async function staffResponse(staffId: string, code: string, message: string) {
  const staff = await getDb().staff.findUniqueOrThrow({ select: staffSelect(), where: { id: staffId } });
  return staffJson({ code, data: { staff: toPublicStaff(staff) }, message, status: HTTP_STATUS.OK, success: true });
}
