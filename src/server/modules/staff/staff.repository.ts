import "server-only";

import type {
  DayOfWeek,
  Prisma,
  SalonMemberRole,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

import type {
  PublicLeave,
  PublicSkill,
  PublicStaffMember,
} from "./staff.types";

/** Columns safe to return on every public staff response. */
const PUBLIC_STAFF_SELECT = {
  id: true,
  userId: true,
  salonId: true,
  role: true,
  user: {
    select: { id: true, name: true, email: true, avatar: true },
  },
} as const satisfies Prisma.SalonMemberSelect;

/**
 * Cursor-paginated staff list for a salon.
 *
 * Why:
 * The same query backs "all members" and "only role X" callers. Fetches one
 * extra row to learn whether a next page exists without a count query.
 */
export async function listSalonStaff(
  salonId: string,
  input: {
    cursor?: string;
    limit: number;
    role?: SalonMemberRole;
  },
) {
  const where: Prisma.SalonMemberWhereInput = {
    salonId,
    ...(input.role ? { role: input.role } : {}),
  };

  const rows = await prisma.salonMember.findMany({
    where,
    select: PUBLIC_STAFF_SELECT,
    orderBy: [{ role: "asc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items: items as PublicStaffMember[],
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Loads a single SalonMember by primary key (scoped to the salon). */
export async function findStaffMemberInSalon(staffId: string, salonId: string) {
  return prisma.salonMember.findFirst({
    where: { id: staffId, salonId },
    select: {
      id: true,
      userId: true,
      salonId: true,
      role: true,
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });
}

/** Returns the caller's SalonMember row for a salon, or null. */
export async function findCallerMembership(salonId: string, userId: string) {
  return prisma.salonMember.findUnique({
    where: { userId_salonId: { userId, salonId } },
    select: { role: true },
  });
}

/** Loads the full weekly schedule for a staff member. */
export async function getStaffSchedule(staffId: string, salonId: string) {
  return prisma.staffSchedule.findMany({
    where: { staffId, salonId },
    orderBy: { day: "asc" },
    select: {
      id: true,
      day: true,
      startTime: true,
      endTime: true,
      isOff: true,
    },
  });
}

/**
 * Replaces the entire weekly schedule in a single transaction.
 *
 * Why:
 * Delete-all-then-insert keeps the client contract simple (send 7 days, get
 * 7 days) and avoids drift from partial updates. The transaction ensures the
 * staff is never left without a schedule if the insert half fails.
 */
export async function replaceStaffSchedule(
  staffId: string,
  salonId: string,
  days: Array<{
    day: DayOfWeek;
    startTime: string | null;
    endTime: string | null;
    isOff: boolean;
  }>,
) {
  await prisma.$transaction(async (transaction) => {
    await transaction.staffSchedule.deleteMany({
      where: { staffId, salonId },
    });

    if (days.length > 0) {
      await transaction.staffSchedule.createMany({
        data: days.map((day) => ({
          staffId,
          salonId,
          day: day.day,
          startTime: day.startTime ?? "00:00",
          endTime: day.endTime ?? "00:00",
          isOff: day.isOff,
        })),
      });
    }
  });
}

/**
 * Cursor-paginated list of leaves for a staff member.
 *
 * Why:
 * Ordered by `startDate` descending so the most recent leave appears first,
 * which matches how an operations dashboard typically reads this list.
 */
export async function listStaffLeaves(
  staffId: string,
  salonId: string,
  input: { cursor?: string; limit: number },
) {
  const rows = await prisma.staffLeave.findMany({
    where: { staffId, salonId },
    orderBy: [{ startDate: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items: items as PublicLeave[],
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Loads a single leave row scoped to a staff + salon. */
export async function findLeaveById(
  leaveId: string,
  staffId: string,
  salonId: string,
) {
  return prisma.staffLeave.findFirst({
    where: { id: leaveId, staffId, salonId },
  });
}

/**
 * Checks for an overlapping leave on the same staff.
 *
 * Why:
 * An overlap check is the only thing standing between two simultaneous leave
 * records for the same day. Returns true when a conflict exists so the
 * service can surface a typed error.
 */
export async function hasOverlappingLeave(
  staffId: string,
  salonId: string,
  startDate: Date,
  endDate: Date,
): Promise<boolean> {
  const existing = await prisma.staffLeave.findFirst({
    where: {
      staffId,
      salonId,
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: { id: true },
  });
  return existing !== null;
}

/** Persists a new leave request. */
export async function createLeave(data: {
  staffId: string;
  salonId: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
}) {
  return prisma.staffLeave.create({ data });
}

/** Updates the approval state of a leave. */
export async function updateLeaveApproval(leaveId: string, approved: boolean) {
  return prisma.staffLeave.update({
    where: { id: leaveId },
    data: { approved },
  });
}

/** Deletes a leave row. */
export async function deleteLeave(leaveId: string): Promise<void> {
  await prisma.staffLeave.delete({ where: { id: leaveId } });
}

/** Loads every skill for a staff member with the joined service. */
export async function listStaffSkills(staffId: string): Promise<PublicSkill[]> {
  const rows = await prisma.staffServiceSkill.findMany({
    where: { staffId },
    orderBy: { createdAt: "asc" },
    select: {
      serviceId: true,
      experience: true,
      service: { select: { id: true, name: true, slug: true } },
    },
  });

  return rows.map((row) => ({
    serviceId: row.serviceId,
    experience: row.experience,
    service: row.service,
  }));
}

/**
 * Replaces all skills for a staff member in a single transaction.
 *
 * Why:
 * Same rationale as the schedule: bulk replace is easier to reason about than
 * incremental diffs, and the transaction keeps the staff from temporarily
 * having no skills if the insert half fails.
 */
export async function replaceStaffSkills(
  staffId: string,
  skills: Array<{ serviceId: string; experience: number | null }>,
) {
  await prisma.$transaction(async (transaction) => {
    await transaction.staffServiceSkill.deleteMany({ where: { staffId } });

    if (skills.length > 0) {
      await transaction.staffServiceSkill.createMany({
        data: skills.map((skill) => ({
          staffId,
          serviceId: skill.serviceId,
          experience: skill.experience,
        })),
      });
    }
  });
}

/** Counts how many of the supplied service ids belong to the salon. */
export async function countSalonServicesByIds(
  salonId: string,
  serviceIds: string[],
): Promise<number> {
  if (serviceIds.length === 0) return 0;

  return prisma.service.count({
    where: {
      id: { in: serviceIds },
      salonId,
      deletedAt: null,
    },
  });
}

/**
 * Public list of staff who can perform a specific service.
 *
 * Why:
 * Powers the "choose your stylist" step on the booking flow. Returns staff
 * who have an explicit StaffServiceSkill for the service, ordered by years
 * of experience descending so the most experienced appear first.
 */
export async function listStaffForService(
  salonId: string,
  serviceId: string,
): Promise<PublicStaffMember[]> {
  const rows = await prisma.staffServiceSkill.findMany({
    where: {
      serviceId,
      staff: {
        salonMemberships: {
          some: { salonId },
        },
      },
    },
    orderBy: [{ experience: "desc" }, { staffId: "asc" }],
    select: {
      staff: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          salonMemberships: {
            where: { salonId },
            select: { id: true, userId: true, salonId: true, role: true },
            take: 1,
          },
        },
      },
    },
  });

  return rows
    .map((row) => row.staff)
    .filter((staff) => staff.salonMemberships.length > 0)
    .map((staff) => {
      const [membership] = staff.salonMemberships;
      return {
        id: membership!.id,
        userId: membership!.userId,
        salonId: membership!.salonId,
        role: membership!.role,
        user: {
          id: staff.id,
          name: staff.name,
          email: staff.email,
          avatar: staff.avatar,
        },
      };
    });
}
