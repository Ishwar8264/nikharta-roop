import type { CatalogStatus } from "@/lib/catalog/status";
import { api } from "@/lib/api/backend.client";

import type { CreateServiceFormValues } from "./schema";
import type { CreateServiceResponse, SalonService, ServiceCategoryOption } from "./types";

/** Creates a service within the selected salon catalogue. */
export function createServiceApi(
  salonRef: string,
  input: CreateServiceFormValues,
): Promise<CreateServiceResponse> {
  const details: Partial<CreateServiceFormValues> = { ...input };
  delete details.status;
  delete details.isActive;
  return api.post<CreateServiceResponse>(
    `/salons/${encodeURIComponent(salonRef)}/services`,
    details,
  );
}

/** Updates a service by internal id, leaving omitted fields unchanged. */
export async function updateServiceApi(salonId: string, serviceId: string, input: Record<string, unknown>) {
  const { status, ...details } = input;
  const path = `/salons/${encodeURIComponent(salonId)}/services/${encodeURIComponent(serviceId)}`;
  let response;
  if (Object.keys(details).length) response = await api.patch<{ message: string; data: { service: SalonService } }>(path, details);
  if (status !== undefined) response = await updateServiceStatusApi(salonId, serviceId, status as CatalogStatus);
  if (!response) throw new Error("No service changes supplied");
  return response;
}

/** Updates publication independently from service details. */
export function updateServiceStatusApi(salonId: string, serviceId: string, status: CatalogStatus) {
  return api.patch<{ message: string; data: { service: SalonService } }>(`/salons/${encodeURIComponent(salonId)}/services/${encodeURIComponent(serviceId)}/status`, { status });
}

/** Soft deletes a service from its salon catalogue. */
export function deleteServiceApi(salonId: string, serviceId: string) {
  return api.delete<{ message: string; data: null }>(
    `/salons/${encodeURIComponent(salonId)}/services/${encodeURIComponent(serviceId)}`,
  );
}

/** Creates a global category for SUPER_ADMIN users. */
export function createServiceCategoryApi(input: { name: string; slug?: string; icon?: string }) {
  return api.post<{ message: string; data: { category: ServiceCategoryOption } }>("/services/categories", input);
}
