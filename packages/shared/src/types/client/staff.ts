import type { DayOfWeek, SalonMemberRole } from "@nikharta-roop/shared/enums";

/**
 * Client-facing staff contracts retain the existing serialized date shapes.
 * Server projection types live in ../server/staff. Keep shared response fields
 * aligned without changing their Date versus string representation.
 */
export interface PublicStaffMember {
  bannerImage?: string | null;
  slug?: string | null;
  id: string;
  userId: string;
  salonId: string;
  role: SalonMemberRole;
  name: string | null;
  avatar: string | null;
  title: string | null;
  description: string | null;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    emailVerified: boolean;
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

/**
 * Public shape of a staff leave request.
 *
 * `startDate` / `endDate` arrive as ISO strings when JSON-serialized over
 * HTTP. Server components that import this type via the api.server proxy
 * may receive `Date` instances instead — both are accepted here so the same
 * shape serves the client fetch and the server-side render.
 */
export interface PublicLeave {
  id: string;
  staffId: string;
  salonId: string;
  startDate: string | Date;
  endDate: string | Date;
  reason: string | null;
  approved: boolean;
  createdAt: string | Date;
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

/** Mirrors `replaceScheduleSchema["days"][number]` minus Zod refinements. */
export interface ScheduleDayInput {
  day: DayOfWeek;
  startTime?: string;
  endTime?: string;
  isOff?: boolean;
}

/** Mirrors `replaceScheduleSchema` — exactly 7 days, one per weekday. */
export interface ReplaceScheduleBody {
  days: ScheduleDayInput[];
}

/** Mirrors `createLeaveSchema` — ISO datetime strings with offset. */
export interface CreateLeaveBody {
  startDate: string;
  endDate: string;
  reason?: string;
}

/** Mirrors `updateLeaveSchema` — only approval state is editable. */
export interface UpdateLeaveBody {
  approved: boolean;
}

/** Mirrors a single entry of `replaceSkillsSchema.skills`. */
export interface SkillInput {
  serviceId: string;
  experience?: number;
}

/** Mirrors `replaceSkillsSchema`. */
export interface ReplaceSkillsBody {
  skills: SkillInput[];
}

/** Mirror of `listStaffQuerySchema` for client-side fetchers. */
export interface ListStaffQuery {
  cursor?: string;
  limit?: number;
  role?: "OWNER" | "MANAGER" | "STAFF";
}

/**
 * Minimal salon-service shape the Skills tab needs.
 *
 * Mirrors the projection the existing package form already passes into its
 * service picker — we deliberately exclude `price` / `duration` because the
 * Skills editor only edits `serviceId` + `experience`, never the service
 * itself.
 */
export interface StaffServiceOption {
  id: string;
  name: string;
  slug: string;
  /** True when the service is currently sellable; inactive services stay hidden from the picker. */
  isActive: boolean;
}

/**
 * The viewer's salon-scoped role, used to gate the schedule / leaves /
 * skills editors on the detail page.
 *
 * The literal union (instead of importing `SalonMemberRole`) makes the gate
 * read clearly: `viewerRole === "OWNER"` for schedule editing,
 * `hasRoleAtLeastManager(viewerRole)` for leaves + skills.
 */
export type StaffViewerRole = SalonMemberRole;

/** Convenience helper — returns true when the role is MANAGER or OWNER. */
export function hasRoleAtLeastManager(role: StaffViewerRole): role is "OWNER" | "MANAGER" {
  return role === "MANAGER" || role === "OWNER";
}
