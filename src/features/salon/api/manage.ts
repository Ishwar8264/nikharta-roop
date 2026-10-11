import type { SalonStatus } from "../status";
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
export async function updateSalonApi(salonId: string, input: Partial<PublicSalon>) {
  const { status, ...details } = input;
  let response;
  if (Object.keys(details).length) response = await api.patch<{ message: string; data: { salon: PublicSalon } }>(salonPath(salonId), details);
  if (status !== undefined) response = await updateSalonStatusApi(salonId, status);
  if (!response) throw new Error("No salon changes supplied");
  return response;
}

/** Updates publication independently from salon profile details. */
export function updateSalonStatusApi(salonId: string, status: SalonStatus) {
  return api.patch<{ message: string; data: { salon: PublicSalon } }>(`${salonPath(salonId)}/status`, { status });
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
export function addSalonMemberApi(salonId: string, input: ({ userId: string } | { email: string }) & { role: "STAFF" | "MANAGER" }) {
  return api.post<{ message: string; data: { member: SalonMember } }>(`${salonPath(salonId)}/members`, input);
}

/** Removes a membership by its own identifier. */
export function removeSalonMemberApi(salonId: string, memberId: string) {
  return api.delete<{ message: string; data: null }>(`${salonPath(salonId)}/members/${encodeURIComponent(memberId)}`);
}
