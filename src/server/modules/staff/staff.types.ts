import type { z } from "zod";

import type { DayOfWeek, SalonMemberRole } from "@/generated/prisma/client";

import type {
  createLeaveSchema,
  listStaffQuerySchema,
  replaceScheduleSchema,
  replaceSkillsSchema,
  updateLeaveSchema,
} from "./staff.schema";

export type ListStaffQuery = z.infer<typeof listStaffQuerySchema>;
export type ReplaceScheduleInput = z.infer<typeof replaceScheduleSchema>;
export type CreateLeaveInput = z.infer<typeof createLeaveSchema>;
export type UpdateLeaveInput = z.infer<typeof updateLeaveSchema>;
export type ReplaceSkillsInput = z.infer<typeof replaceSkillsSchema>;

/** Public shape of a staff member (a SalonMember joined with its User). */
export interface PublicStaffMember {
  id: string;
  userId: string;
  salonId: string;
  role: SalonMemberRole;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
  };
}

/** Cursor-paginated staff list. */
export interface PaginatedStaff {
  items: PublicStaffMember[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** A single day in a staff member's weekly schedule. */
export interface PublicScheduleDay {
  id: string;
  day: DayOfWeek;
  startTime: string | null;
  endTime: string | null;
  isOff: boolean;
}

/** Public shape of a staff leave request. */
export interface PublicLeave {
  id: string;
  staffId: string;
  salonId: string;
  startDate: Date;
  endDate: Date;
  reason: string | null;
  approved: boolean;
  createdAt: Date;
}

/** Cursor-paginated leave list. */
export interface PaginatedLeaves {
  items: PublicLeave[];
  nextCursor: string | null;
  hasMore: boolean;
}

/** Public shape of a staff ↔ service skill. */
export interface PublicSkill {
  serviceId: string;
  experience: number | null;
  service: {
    id: string;
    name: string;
    slug: string;
  };
}

/** The caller's resolved context inside a salon. */
export interface StaffViewerContext {
  salonId: string;
  callerRole: SalonMemberRole;
  targetMember: {
    userId: string;
  };
  isSelf: boolean;
}
