/**
 * Purpose: Admin handlers for staff listing, creation, and profile updates.
 * Responsibilities: validate payloads, enforce branch scope, connect users/services, and return public-safe staff data.
 * Important notes: staff creation checks independent parent records together before writing.
 */
import { Prisma, UserRole } from "@prisma/client";
import type { ZodError } from "zod";

import { getDb } from "@/db";
import { STAFF_CODES, STAFF_MESSAGES } from "@/features/staff/constants/staff.constants";
import { toPublicStaff } from "@/features/staff/helpers/staff.mapper";
import { staffSelect } from "@/features/staff/helpers/staff.selectors";
import { staffJson } from "@/features/staff/responses/staff.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  createStaffSchema,
  type CreateStaffInput,
  listAdminStaffQuerySchema,
  type ListAdminStaffQueryInput,
  updateStaffSchema,
  type UpdateStaffInput,
} from "@/schema/staff/schema.staff";
import {
  assertCanManageBranch,
  assertManageableStaff,
  handleStaffWriteError,
  parseStaffJsonBody,
  requireStaffAdmin,
  resolveAdminBranchFilter,
  type StaffAdminUser,
  StaffVisibleError,
} from "./staff-admin.shared";

/**
 * Handles admin staff listing including unavailable staff.
 */
export async function handleListAdminStaff(request: Request) {
  const auth = await requireStaffAdmin(request);
  if (!auth.success) return auth.error;
  const query = parseAdminStaffQuery(request);
  if (query.error) return query.error;
  return listAdminStaff(query.data, auth.session.user);
}

/**
 * Handles admin staff detail loading including unavailable staff.
 */
export async function handleGetAdminStaff(request: Request, staffId: string) {
  const auth = await requireStaffAdmin(request);
  if (!auth.success) return auth.error;
  return getAdminStaff(staffId, auth.session.user);
}

/**
 * Handles admin staff creation.
 */
export async function handleCreateStaff(request: Request) {
  const auth = await requireStaffAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseStaffJsonBody(request, createStaffSchema);
  if (body.error) return body.error;
  return createStaff(body.data, auth.session.user);
}

/**
 * Handles admin staff updates.
 */
export async function handleUpdateStaff(request: Request, staffId: string) {
  const auth = await requireStaffAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseStaffJsonBody(request, updateStaffSchema);
  if (body.error) return body.error;
  return updateStaff(staffId, body.data, auth.session.user);
}

/**
 * Loads one staff profile after admin branch-scope checks.
 */
async function getAdminStaff(staffId: string, admin: StaffAdminUser) {
  try {
    await assertManageableStaff(staffId, admin);
    const staff = await getDb().staff.findUnique({
      select: staffSelect(),
      where: { id: staffId },
    });

    if (!staff) {
      throw new StaffVisibleError(
        STAFF_CODES.STAFF_NOT_FOUND,
        STAFF_MESSAGES.STAFF_NOT_FOUND,
        HTTP_STATUS.NOT_FOUND,
      );
    }

    return staffJson({
      code: STAFF_CODES.STAFF_LOADED,
      data: { staff: toPublicStaff(staff) },
      message: STAFF_MESSAGES.STAFF_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleStaffWriteError(error, STAFF_CODES.STAFF_LOAD_FAILED, STAFF_MESSAGES.STAFF_LOAD_FAILED);
  }
}

/**
 * Lists staff visible to the authenticated admin scope.
 */
async function listAdminStaff(input: ListAdminStaffQueryInput, admin: StaffAdminUser) {
  try {
    const branchId = resolveAdminBranchFilter(input.branchId, admin);
    const staff = await getDb().staff.findMany({
      orderBy: [{ branch: { city: "asc" } }, { user: { name: "asc" } }, { id: "asc" }],
      select: staffSelect(),
      take: input.limit,
      where: {
        branchId,
        isAvailable:
          input.status === "available"
            ? true
            : input.status === "unavailable"
              ? false
              : undefined,
        services: input.serviceId ? { some: { serviceId: input.serviceId } } : undefined,
      },
    });

    return staffJson({
      code: STAFF_CODES.STAFF_LISTED,
      data: { limit: input.limit, staff: staff.map(toPublicStaff) },
      message: STAFF_MESSAGES.STAFF_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleStaffWriteError(error, STAFF_CODES.STAFF_LIST_LOAD_FAILED, STAFF_MESSAGES.STAFF_LIST_LOAD_FAILED);
  }
}

/**
 * Creates a staff profile and optional initial service assignments.
 */
async function createStaff(input: CreateStaffInput, admin: StaffAdminUser) {
  try {
    assertCanManageBranch(admin, input.branchId);
    await assertStaffCreateParents(input);
    // Keep staff creation and user role promotion atomic so partial writes cannot leave a customer promoted without a staff profile.
    const [staff] = await getDb().$transaction((tx) =>
      Promise.all([
        tx.staff.create({
          data: {
            ...toStaffData(input),
            services: { create: input.serviceIds.map((serviceId) => ({ serviceId })) },
          },
          select: staffSelect(),
        }),
        tx.user.update({ data: { role: UserRole.STAFF }, where: { id: input.userId } }),
      ]),
    );

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

/**
 * Updates one staff profile while preserving branch ownership rules.
 */
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

/**
 * Verifies staff creation dependencies before writing the profile.
 */
async function assertStaffCreateParents(input: CreateStaffInput) {
  const [user] = await Promise.all([
    getDb().user.findFirst({ select: { id: true }, where: { id: input.userId, isActive: true } }),
    assertBranch(input.branchId),
    Promise.all(
      input.serviceIds.map((serviceId) => assertService(input.branchId, serviceId)),
    ),
  ]);

  if (!user) throw new StaffVisibleError(STAFF_CODES.USER_NOT_FOUND, STAFF_MESSAGES.USER_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
}

/**
 * Verifies that a branch exists and is active.
 */
async function assertBranch(branchId: string) {
  const branch = await getDb().branch.findFirst({ select: { id: true }, where: { id: branchId, isActive: true } });
  if (!branch) throw new StaffVisibleError(STAFF_CODES.BRANCH_NOT_FOUND, STAFF_MESSAGES.BRANCH_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
}

/**
 * Verifies that an assigned service belongs to the selected branch.
 */
async function assertService(branchId: string, serviceId: string) {
  const service = await getDb().service.findFirst({ select: { id: true }, where: { branchId, id: serviceId, isActive: true } });
  if (!service) throw new StaffVisibleError(STAFF_CODES.SERVICE_NOT_FOUND, STAFF_MESSAGES.SERVICE_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
}

/**
 * Converts create input into Prisma-safe staff data.
 */
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

/**
 * Converts update input into Prisma-safe staff data.
 */
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

/**
 * Parses admin list query strings with staff-owned validation errors.
 */
function parseAdminStaffQuery(request: Request) {
  const parsed = listAdminStaffQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );

  if (!parsed.success) {
    return {
      data: null,
      error: staffJson({
        code: STAFF_CODES.VALIDATION_ERROR,
        data: null,
        message: getStaffValidationMessage(parsed.error),
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
        success: false,
      }),
    };
  }

  return { data: parsed.data, error: null };
}

/**
 * Keeps validation responses focused on the first actionable field.
 */
function getStaffValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? STAFF_MESSAGES.VALIDATION_ERROR;
}

/**
 * Converts local time input into a Date compatible with Prisma @db.Time.
 */
function toTimeDate(value: string) {
  return new Date(`1970-01-01T${value.length === 5 ? `${value}:00` : value}.000Z`);
}
