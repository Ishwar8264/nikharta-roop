import { api } from "@/lib/api/backend.client";

import type { PublicSalon } from "../types";

export interface SalonMember {
  id: string;
  userId: string;
  salonId: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  user: { id: string; name: string | null; email: string | null };
}

const salonPath = (salonId: string) => `/salons/${encodeURIComponent(salonId)}`;

/** Updates only fields supplied by the management form. */
export function updateSalonApi(salonId: string, input: Partial<PublicSalon>) {
  return api.patch<{ message: string; data: { salon: PublicSalon } }>(salonPath(salonId), input);
}

/** Soft deletes an owner-managed salon. */
export function deleteSalonApi(salonId: string) {
  return api.delete<{ message: string; data: null }>(salonPath(salonId));
}

/** Loads the roster using the salon's internal identifier. */
export function listSalonMembersApi(salonId: string) {
  return api.get<{ message: string; data: SalonMember[] }>(`${salonPath(salonId)}/members`);
}

/** Adds an existing user to the salon. */
export function addSalonMemberApi(salonId: string, input: { userId: string; role: SalonMember["role"] }) {
  return api.post<{ message: string; data: { member: SalonMember } }>(`${salonPath(salonId)}/members`, input);
}

/** Removes a membership by its own identifier. */
export function removeSalonMemberApi(salonId: string, memberId: string) {
  return api.delete<{ message: string; data: null }>(`${salonPath(salonId)}/members/${encodeURIComponent(memberId)}`);
}
