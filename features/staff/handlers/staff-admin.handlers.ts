import { Prisma, UserRole } from "@prisma/client";

import { getDb } from "@/db";
import { STAFF_CODES, STAFF_MESSAGES } from "@/features/staff/constants/staff.constants";
import { toPublicStaff } from "@/features/staff/helpers/staff.mapper";
import { staffSelect } from "@/features/staff/helpers/staff.selectors";
import { staffJson } from "@/features/staff/responses/staff.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createStaffSchema,
  type CreateStaffInput,
  updateStaffSchema,
  type UpdateStaffInput,
} from "@/schema/staff/schema.staff";
import {
  assertCanManageBranch,
  assertManageableStaff,
  handleStaffWriteError,
  parseStaffJsonBody,
  requireStaffAdmin,
  type StaffAdminUser,
  StaffVisibleError,
} from "./staff-admin.shared";

export async function handleCreateStaff(request: Request) {
  const auth = await requireStaffAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseStaffJsonBody(request, createStaffSchema);
  if (body.error) return body.error;
  return createStaff(body.data, auth.session.user);
}

export async function handleUpdateStaff(request: Request, staffId: string) {
  const auth = await requireStaffAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseStaffJsonBody(request, updateStaffSchema);
  if (body.error) return body.error;
  return updateStaff(staffId, body.data, auth.session.user);
}

async function createStaff(input: CreateStaffInput, admin: StaffAdminUser) {
  try {
    assertCanManageBranch(admin, input.branchId);
    await assertStaffCreateParents(input);
    const staff = await getDb().staff.create({
      data: {
        ...toStaffData(input),
        services: { create: input.serviceIds.map((serviceId) => ({ serviceId })) },
      },
      select: staffSelect(),
    });
    await getDb().user.update({ data: { role: UserRole.STAFF }, where: { id: input.userId } });
    return staffJson({
      code: STAFF_CODES.STAFF_CREATED,
      data: { staff: toPublicStaff(staff) },
      message: STAFF_MESSAGES.STAFF_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleStaffWriteError(error, STAFF_CODES.STAFF_CREATE_FAILED, STAFF_MESSAGES.STAFF_CREATE_FAILED);
  }
}

async function updateStaff(staffId: string, input: UpdateStaffInput, admin: StaffAdminUser) {
  try {
    const current = await assertManageableStaff(staffId, admin);
    if (input.branchId) assertCanManageBranch(admin, input.branchId);
    if (input.branchId && input.branchId !== current.branchId) await assertBranch(input.branchId);
    const staff = await getDb().staff.update({
      data: toStaffUpdateData(input),
      select: staffSelect(),
      where: { id: staffId },
    });
    return staffJson({
      code: STAFF_CODES.STAFF_UPDATED,
      data: { staff: toPublicStaff(staff) },
      message: STAFF_MESSAGES.STAFF_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleStaffWriteError(error, STAFF_CODES.STAFF_UPDATE_FAILED, STAFF_MESSAGES.STAFF_UPDATE_FAILED);
  }
}

async function assertStaffCreateParents(input: CreateStaffInput) {
  await assertBranch(input.branchId);
  const user = await getDb().user.findFirst({ select: { id: true }, where: { id: input.userId, isActive: true } });
  if (!user) throw new StaffVisibleError(STAFF_CODES.USER_NOT_FOUND, STAFF_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  for (const serviceId of input.serviceIds) await assertService(input.branchId, serviceId);
}

async function assertBranch(branchId: string) {
  const branch = await getDb().branch.findFirst({ select: { id: true }, where: { id: branchId, isActive: true } });
  if (!branch) throw new StaffVisibleError(STAFF_CODES.BRANCH_NOT_FOUND, STAFF_MESSAGES.BRANCH_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
}

async function assertService(branchId: string, serviceId: string) {
  const service = await getDb().service.findFirst({ select: { id: true }, where: { branchId, id: serviceId, isActive: true } });
  if (!service) throw new StaffVisibleError(STAFF_CODES.SERVICE_NOT_FOUND, STAFF_MESSAGES.SERVICE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
}

function toStaffData(input: CreateStaffInput) {
  return {
    bioEn: input.bioEn ?? null,
    bioHi: input.bioHi ?? null,
    branchId: input.branchId,
    experienceYears: input.experienceYears ?? null,
    isAvailable: input.isAvailable ?? true,
    photoUrl: input.photoUrl ?? null,
    specialization: input.specialization ?? [],
    userId: input.userId,
    workDays: input.workDays ?? [],
    workEnd: toTimeDate(input.workEnd),
    workStart: toTimeDate(input.workStart),
  } satisfies Prisma.StaffUncheckedCreateInput;
}

function toStaffUpdateData(input: UpdateStaffInput) {
  return {
    bioEn: input.bioEn,
    bioHi: input.bioHi,
    branchId: input.branchId,
    experienceYears: input.experienceYears,
    isAvailable: input.isAvailable,
    photoUrl: input.photoUrl,
    specialization: input.specialization,
    workDays: input.workDays,
    workEnd: input.workEnd ? toTimeDate(input.workEnd) : undefined,
    workStart: input.workStart ? toTimeDate(input.workStart) : undefined,
  } satisfies Prisma.StaffUncheckedUpdateInput;
}

function toTimeDate(value: string) {
  return new Date(`1970-01-01T${value.length === 5 ? `${value}:00` : value}.000Z`);
}
