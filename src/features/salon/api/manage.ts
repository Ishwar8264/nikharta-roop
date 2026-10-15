import type { SalonStatus } from "../status";
import { api } from "@/lib/api/backend.client";

import type { PublicSalon } from "../types";

export interface SalonMember {
  bannerImage?: string | null;
  slug?: string | null;
  id: string;
  userId: string;
  salonId: string;
  role: "OWNER" | "MANAGER" | "STAFF";
  name: string | null;
  avatar: string | null;
  title: string | null;
  description: string | null;
  verificationEmailSent?: boolean | null;
  user: { id: string; name: string | null; email: string | null; emailVerified: boolean };
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
export function addSalonMemberApi(salonId: string, input: ({ userId: string; name?: string } | { email: string; name: string }) & { role: "STAFF" | "MANAGER"; slug?: string; avatar?: string | null; bannerImage?: string | null; title?: string | null; description?: string | null }) {
  return api.post<{ message: string; data: { member: SalonMember } }>(`${salonPath(salonId)}/members`, input);
}

/** Removes a membership by its own identifier. */
export function removeSalonMemberApi(salonId: string, memberId: string) {
  return api.delete<{ message: string; data: null }>(`${salonPath(salonId)}/members/${encodeURIComponent(memberId)}`);
}

/** Updates only the signed-in member's salon profile, including their chosen URL slug. */
export function updateSalonMemberApi(salonId: string, memberId: string,
  input: { name?: string; slug?: string; avatar?: string | null; bannerImage?: string | null; title?: string | null; description?: string | null }) {
  return api.patch<{ message: string; data: { member: SalonMember } }>(`${salonPath(salonId)}/members/${encodeURIComponent(memberId)}`, input);
}
