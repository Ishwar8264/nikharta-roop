import { api } from "@/lib/api/backend.client";

import type { CreateServiceFormValues } from "./schema";
import type { CreateServiceResponse, SalonService, ServiceCategoryOption } from "./types";

/** Creates a service within the selected salon catalogue. */
export function createServiceApi(
  salonRef: string,
  input: CreateServiceFormValues,
): Promise<CreateServiceResponse> {
  return api.post<CreateServiceResponse>(
    `/salons/${encodeURIComponent(salonRef)}/services`,
    input,
  );
}

/** Updates a service by internal id, leaving omitted fields unchanged. */
export function updateServiceApi(salonId: string, serviceId: string, input: Record<string, unknown>) {
  return api.patch<{ message: string; data: { service: SalonService } }>(
    `/salons/${encodeURIComponent(salonId)}/services/${encodeURIComponent(serviceId)}`,
    input,
  );
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
