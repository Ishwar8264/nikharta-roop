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
