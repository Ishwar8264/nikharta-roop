import "server-only";

import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import { ServiceNotFoundError } from "@/server/modules/service/service.errors";
import {
  findServiceById,
  findServiceBySlug,
  resolveSalonId,
} from "@/server/modules/service/service.repository";

import { assertManagerOrSelf } from "./staff.authorization";
import {
  StaffLeaveAlreadyApprovedError,
  StaffLeaveNotFoundError,
  StaffLeaveOverlapError,
  StaffNotFoundError,
  StaffSelfModificationError,
  StaffSkillServiceMismatchError,
} from "./staff.errors";
import {
  countSalonServicesByIds,
  createLeave,
  deleteLeave,
  findCallerMembership,
  findLeaveById,
  findStaffMemberInSalon,
  getStaffSchedule,
  hasOverlappingLeave,
  listSalonStaff,
  listStaffForService,
  listStaffLeaves,
  listStaffSkills,
  replaceStaffSchedule,
  replaceStaffSkills,
  updateLeaveApproval,
} from "./staff.repository";
import type {
  CreateLeaveInput,
  ListStaffQuery,
  PaginatedLeaves,
  PaginatedStaff,
  PublicLeave,
  PublicScheduleDay,
  PublicSkill,
  PublicStaffMember,
  ReplaceScheduleInput,
  ReplaceSkillsInput,
  StaffViewerContext,
  UpdateLeaveInput,
} from "./staff.types";

/**
 * Lists staff members of a salon.
 *
 * Any salon member can view the internal directory.
 */
export async function listStaff(
  callerId: string,
  salonRef: string,
  query: ListStaffQuery,
): Promise<PaginatedStaff> {
  const salonId = await resolveSalonId(salonRef, true);
  if (!salonId) throw new SalonNotFoundError();

  const caller = await findCallerMembership(salonId, callerId);
  if (!caller) throw new SalonNotFoundError();

  return listSalonStaff(salonId, query);
}

/** Loads a staff member's public profile, if visible to the caller. */
export async function getStaffDetail(
  callerId: string,
  salonRef: string,
  staffId: string,
): Promise<PublicStaffMember> {
  const context = await loadStaffContext(callerId, salonRef, staffId);
  // Any member of the salon can see the directory entry, same as listing.
  void context;
  const member = await findStaffMemberInSalon(staffId, context.salonId);
  if (!member) throw new StaffNotFoundError();
  return member;
}

/** Returns the weekly schedule for a staff member. */
export async function getSchedule(
  callerId: string,
  salonRef: string,
  staffId: string,
): Promise<PublicScheduleDay[]> {
  const context = await loadStaffContext(callerId, salonRef, staffId);
  assertManagerOrSelf(context, "MANAGER");
  return getStaffSchedule(context.targetMember.userId, context.salonId);
}

/**
 * Replaces a staff member's weekly schedule.
 *
 * Why:
 * MANAGER+ only (Option A). The staff member cannot edit their own schedule
 * because schedule changes affect customer bookings, which the staff member
 * is not responsible for. Leave requests are the staff-side escape hatch.
 */
export async function replaceSchedule(
  callerId: string,
  salonRef: string,
  staffId: string,
  input: ReplaceScheduleInput,
): Promise<PublicScheduleDay[]> {
  const context = await loadStaffContext(callerId, salonRef, staffId);
  assertManagerOrSelf(context, "MANAGER");

  if (context.isSelf && context.callerRole !== "OWNER") {
    // STAFF cannot edit their own schedule — see comment above.
    throw new StaffSelfModificationError();
  }

  await replaceStaffSchedule(
    context.targetMember.userId,
    context.salonId,
    input.days.map((day) => ({
      day: day.day,
      startTime: day.startTime ?? null,
      endTime: day.endTime ?? null,
      isOff: day.isOff,
    })),
  );

  return getStaffSchedule(context.targetMember.userId, context.salonId);
}

/** Lists leave requests for a staff member. */
export async function listLeaves(
  callerId: string,
  salonRef: string,
  staffId: string,
): Promise<PaginatedLeaves> {
  const context = await loadStaffContext(callerId, salonRef, staffId);
  assertManagerOrSelf(context, "MANAGER");

  // Leaves are small enough that pagination here is a formality.
  return listStaffLeaves(context.targetMember.userId, context.salonId, {
    limit: 50,
  });
}

/**
 * Creates a leave request for a staff member.
 *
 * Why:
 * MANAGER+ or the staff member themselves. Staff members are the natural
 * author of their own leave requests; managers might add one on their behalf
 * when handling a call-out.
 */
export async function createStaffLeave(
  callerId: string,
  salonRef: string,
  staffId: string,
  input: CreateLeaveInput,
): Promise<PublicLeave> {
  const context = await loadStaffContext(callerId, salonRef, staffId);
  assertManagerOrSelf(context, "MANAGER");

  const startDate = new Date(input.startDate);
  const endDate = new Date(input.endDate);

  const overlaps = await hasOverlappingLeave(
    context.targetMember.userId,
    context.salonId,
    startDate,
    endDate,
  );
  if (overlaps) throw new StaffLeaveOverlapError();

  return createLeave({
    staffId: context.targetMember.userId,
    salonId: context.salonId,
    startDate,
    endDate,
    reason: input.reason ?? null,
  });
}

/**
 * Approves or rejects a leave request.
 *
 * Why:
 * MANAGER+ only, and not the staff member themselves — otherwise a staff
 * could self-approve a vacation. This is the reason for the "and not self"
 * assertion rather than the union used for viewing.
 */
export async function updateStaffLeave(
  callerId: string,
  salonRef: string,
  staffId: string,
  leaveId: string,
  input: UpdateLeaveInput,
): Promise<PublicLeave> {
  const context = await loadStaffContext(callerId, salonRef, staffId);

  if (context.isSelf) {
    // Even a MANAGER cannot approve their own leave.
    throw new StaffSelfModificationError();
  }

  if (context.callerRole === "STAFF") {
    throw new StaffSelfModificationError();
  }

  const leave = await findLeaveById(
    leaveId,
    context.targetMember.userId,
    context.salonId,
  );
  if (!leave) throw new StaffLeaveNotFoundError();

  return updateLeaveApproval(leaveId, input.approved);
}

/**
 * Cancels a leave request.
 *
 * Why:
 * MANAGER+ can cancel any leave. A staff member can cancel their own leave
 * only while it is still pending — once approved, a manager must release it
 * so the operations team sees the change.
 */
export async function cancelStaffLeave(
  callerId: string,
  salonRef: string,
  staffId: string,
  leaveId: string,
): Promise<void> {
  const context = await loadStaffContext(callerId, salonRef, staffId);
  assertManagerOrSelf(context, "MANAGER");

  const leave = await findLeaveById(
    leaveId,
    context.targetMember.userId,
    context.salonId,
  );
  if (!leave) throw new StaffLeaveNotFoundError();

  if (context.isSelf && leave.approved) {
    throw new StaffLeaveAlreadyApprovedError();
  }

  await deleteLeave(leaveId);
}

/** Lists the skills (services) a staff member can perform. */
export async function getSkills(
  callerId: string,
  salonRef: string,
  staffId: string,
): Promise<PublicSkill[]> {
  const context = await loadStaffContext(callerId, salonRef, staffId);
  assertManagerOrSelf(context, "MANAGER");
  return listStaffSkills(context.targetMember.userId);
}

/**
 * Replaces a staff member's skills.
 *
 * Why:
 * MANAGER+ only. Skills determine which bookings a staff member can receive,
 * so the operations team owns this list. Every service must belong to the
 * same salon — otherwise a staff could be assigned a service from another
 * tenant.
 */
export async function replaceSkills(
  callerId: string,
  salonRef: string,
  staffId: string,
  input: ReplaceSkillsInput,
): Promise<PublicSkill[]> {
  const context = await loadStaffContext(callerId, salonRef, staffId);
  assertManagerOrSelf(context, "MANAGER");

  const serviceIds = input.skills.map((skill) => skill.serviceId);
  const uniqueIds = Array.from(new Set(serviceIds));

  if (uniqueIds.length > 0) {
    const validCount = await countSalonServicesByIds(
      context.salonId,
      uniqueIds,
    );
    if (validCount !== uniqueIds.length) {
      throw new StaffSkillServiceMismatchError();
    }
  }

  await replaceStaffSkills(
    context.targetMember.userId,
    input.skills.map((skill) => ({
      serviceId: skill.serviceId,
      experience: skill.experience ?? null,
    })),
  );

  return listStaffSkills(context.targetMember.userId);
}

/**
 * Public list of staff who can perform a given service.
 *
 * Why:
 * Powers the "choose your stylist" step of the booking flow. No
 * authentication — anonymous visitors must be able to see who is available
 * before they sign up.
 */
export async function listStaffForSalonService(
  salonRef: string,
  serviceRef: string,
): Promise<PublicStaffMember[]> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  // The service must belong to the salon. Querying by (salonId, serviceRef)
  // keeps an attacker from enumerating services across tenants.
  const service = await findServiceForSalon(salonId, serviceRef);
  if (!service) throw new ServiceNotFoundError();

  return listStaffForService(salonId, service.id);
}

/**
 * Resolves the caller + target staff context in one go.
 *
 * Why:
 * Every staff sub-resource route needs the same four values (salonId, caller
 * role, target member, isSelf). Loading them once here avoids duplicating the
 * lookup and keeps the "hidden vs missing" error handling consistent.
 */
async function loadStaffContext(
  callerId: string,
  salonRef: string,
  staffId: string,
): Promise<StaffViewerContext> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const caller = await findCallerMembership(salonId, callerId);
  if (!caller) throw new SalonNotFoundError();

  const target = await findStaffMemberInSalon(staffId, salonId);
  if (!target) throw new StaffNotFoundError();

  return {
    salonId,
    callerRole: caller.role,
    targetMember: {
      userId: target.userId,
    },
    isSelf: target.userId === callerId,
  };
}

/** Resolves a service by ID or slug while keeping it scoped to the salon. */
async function findServiceForSalon(
  salonId: string,
  serviceRef: string,
): Promise<{ id: string } | null> {
  if (isResourceId(serviceRef)) {
    const byId = await findServiceById(serviceRef);
    if (byId && byId.salonId === salonId) return { id: byId.id };
    return null;
  }

  const bySlug = await findServiceBySlug(salonId, serviceRef);
  if (!bySlug) return null;
  return { id: bySlug.id };
}
