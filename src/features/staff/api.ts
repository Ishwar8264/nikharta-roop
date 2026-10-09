import { api } from "@/lib/api/backend.client";

import type {
  CreateLeaveBody,
  PublicLeave,
  PublicScheduleDay,
  PublicSkill,
  PublicStaffMember,
  ReplaceScheduleBody,
  ReplaceSkillsBody,
  UpdateLeaveBody,
} from "./types";

/**
 * Client-side API wrappers for the salon staff endpoints.
 *
 * Why a thin per-call wrapper (instead of one generic `request` helper):
 * Each backend route has a slightly different envelope (`{ data: { staff } }`
 * vs `{ data: result.items, meta }`). Naming the response shape at the call
 * site keeps the consumer's `.data.staff` access checked by TypeScript
 * without a runtime parse step, and lets `api` continue to own the CSRF /
 * refresh concerns.
 *
 * Every path is built with `encodeURIComponent` so a salon slug containing
 * a `/` or `?` cannot break out of its segment. The base `/salons/...`
 * prefix matches the existing REST routes under
 * `src/app/api/v1/salons/[salonRef]/staff/*`.
 */

/** Response envelope for routes that return one staff member. */
interface StaffDetailResponse {
  message: string;
  data: { staff: PublicStaffMember };
}

/** Response envelope for routes that return a schedule. */
interface ScheduleResponse {
  message: string;
  data: { schedule: PublicScheduleDay[] };
}

/** Response envelope for routes that return one leave. */
interface LeaveResponse {
  message: string;
  data: { leave: PublicLeave };
}

/** Response envelope for routes that return skills. */
interface SkillsResponse {
  message: string;
  data: { skills: PublicSkill[] };
}

/** Response envelope for the staff list route (paginated). */
interface StaffListResponse {
  message: string;
  data: PublicStaffMember[];
  meta: { nextCursor: string | null; hasMore: boolean };
}

/** Response envelope for the leaves list route (paginated). */
interface LeaveListResponse {
  message: string;
  data: PublicLeave[];
  meta: { nextCursor: string | null; hasMore: boolean };
}

/** Lists staff members of a salon. MANAGER+ (page-level guard). */
export function listStaffApi(salonRef: string, query?: { limit?: number }) {
  const search = query?.limit ? `?limit=${query.limit}` : "";
  return api.get<StaffListResponse>(
    `/salons/${encodeURIComponent(salonRef)}/staff${search}`,
  );
}

/** Loads a single staff member's public profile. */
export function getStaffDetailApi(salonRef: string, staffId: string) {
  return api.get<StaffDetailResponse>(
    `/salons/${encodeURIComponent(salonRef)}/staff/${encodeURIComponent(staffId)}`,
  );
}

/** Replaces a staff member's weekly schedule (PUT 7-day body). OWNER-only. */
export function replaceScheduleApi(
  salonRef: string,
  staffId: string,
  body: ReplaceScheduleBody,
) {
  return api.put<ScheduleResponse>(
    `/salons/${encodeURIComponent(salonRef)}/staff/${encodeURIComponent(staffId)}/schedule`,
    body,
  );
}

/** Lists leave requests for a staff member. MANAGER+ or self. */
export function listLeavesApi(salonRef: string, staffId: string) {
  return api.get<LeaveListResponse>(
    `/salons/${encodeURIComponent(salonRef)}/staff/${encodeURIComponent(staffId)}/leaves`,
  );
}

/** Creates a leave request. MANAGER+ or self. */
export function createLeaveApi(
  salonRef: string,
  staffId: string,
  body: CreateLeaveBody,
) {
  return api.post<LeaveResponse>(
    `/salons/${encodeURIComponent(salonRef)}/staff/${encodeURIComponent(staffId)}/leaves`,
    body,
  );
}

/** Approves or rejects a leave. MANAGER+ only, not self. */
export function updateLeaveApi(
  salonRef: string,
  staffId: string,
  leaveId: string,
  body: UpdateLeaveBody,
) {
  return api.patch<LeaveResponse>(
    `/salons/${encodeURIComponent(salonRef)}/staff/${encodeURIComponent(staffId)}/leaves/${encodeURIComponent(leaveId)}`,
    body,
  );
}

/** Cancels a leave. MANAGER+ any, staff own pending only. */
export function cancelLeaveApi(
  salonRef: string,
  staffId: string,
  leaveId: string,
) {
  return api.delete<{ message: string; data: null }>(
    `/salons/${encodeURIComponent(salonRef)}/staff/${encodeURIComponent(staffId)}/leaves/${encodeURIComponent(leaveId)}`,
  );
}

/** Replaces a staff member's skills (PUT bulk body). MANAGER+ only. */
export function replaceSkillsApi(
  salonRef: string,
  staffId: string,
  body: ReplaceSkillsBody,
) {
  return api.put<SkillsResponse>(
    `/salons/${encodeURIComponent(salonRef)}/staff/${encodeURIComponent(staffId)}/skills`,
    body,
  );
}
