import "server-only";

import { api } from "@/lib/api/backend.server";
import type { AppointmentStatus, PublicAppointment } from "./types";

/** Loads the authenticated customer's appointment list through the API. */
export async function listAppointments(input: { cursor?: string; status?: AppointmentStatus }) {
  const query = new URLSearchParams({ limit: "20" });
  if (input.cursor) query.set("cursor", input.cursor);
  if (input.status) query.set("status", input.status);
  const response = await api.get<{ data: PublicAppointment[]; meta: { nextCursor: string | null; hasMore: boolean } }>(`/appointments?${query}`);
  return { items: response.data, ...response.meta };
}

/** Loads one authorized appointment through the API. */
export async function getAppointment(id: string): Promise<PublicAppointment> {
  const response = await api.get<{ data: { appointment: PublicAppointment } }>(`/appointments/${encodeURIComponent(id)}`);
  return response.data.appointment;
}
