import { api } from "@/lib/api/backend.client";

import type { CreateServiceFormValues } from "./schema";
import type { CreateServiceResponse } from "./types";

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
