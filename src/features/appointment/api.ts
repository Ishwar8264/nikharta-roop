import { api } from "@/lib/api/backend.client";

import type {
  AvailabilitySlot,
  BookingStaff,
  CreateAppointmentInput,
  PublicAppointment,
} from "./types";

/** Loads staff eligible to perform a salon service. */
export async function getServiceStaff(
  salonSlug: string,
  serviceSlug: string,
): Promise<BookingStaff[]> {
  const response = await api.get<{ message: string; data: BookingStaff[] }>(
    `/salons/${encodeURIComponent(salonSlug)}/services/${encodeURIComponent(serviceSlug)}/staff`,
  );
  return response.data;
}

/** Loads authoritative bookable slots for a staff/service/date combination. */
export async function getAvailability(input: {
  salonSlug: string;
  staffId: string;
  serviceIds: string[];
  date: string;
}): Promise<AvailabilitySlot[]> {
  const query = new URLSearchParams({
    staffId: input.staffId,
    serviceIds: input.serviceIds.join(","),
    date: input.date,
  });
  const response = await api.get<{
    message: string;
    data: { slots: AvailabilitySlot[] };
  }>(`/salons/${encodeURIComponent(input.salonSlug)}/availability?${query}`);
  return response.data.slots;
}

/** Creates one authenticated customer appointment. */
export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<PublicAppointment> {
  const response = await api.post<{
    message: string;
    data: { appointment: PublicAppointment };
  }>("/appointments", input);
  return response.data.appointment;
}

/**
 * Drives an appointment through its lifecycle (confirm, start, complete,
 * cancel, mark no-show).
 *
 * Why a thin wrapper:
 * The PATCH `/api/v1/appointments/{id}/status` route validates the body
 * against `updateAppointmentStatusSchema` and runs the full access + state
 * machine checks (`assertCanTransitionStatus`, `TERMINAL_STATUSES`,
 * `ALLOWED_TRANSITIONS`). The client only needs to send `{ status, reason? }`
 * and let the server be the source of truth. The browser-side copy of the
 * transition map (in `salon-appointment-detail.tsx`) is purely for UI gating —
 * the server rejects illegal transitions regardless of what the client shows.
 *
 * `targetStatus` is constrained to the non-terminal statuses the schema
 * accepts (SCHEDULED and RESCHEDULED are intentionally absent — those are
 * never valid *target* states from the manage UI).
 */
export async function updateAppointmentStatusApi(
  appointmentId: string,
  input: {
    status:
      | "CONFIRMED"
      | "IN_PROGRESS"
      | "COMPLETED"
      | "CANCELLED"
      | "NO_SHOW";
    reason?: string;
  },
): Promise<PublicAppointment> {
  const response = await api.patch<{
    message: string;
    data: { appointment: PublicAppointment };
  }>(
    `/appointments/${encodeURIComponent(appointmentId)}/status`,
    input,
  );
  return response.data.appointment;
}
