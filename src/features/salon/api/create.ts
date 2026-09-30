import { api } from "@/lib/api/backend.client";

import type { CreateSalonFormValues } from "../schemas";
import type { CreateSalonResponse } from "../types";

/**
 * Posts a new salon to the API.
 *
 * Why a thin wrapper:
 * Same rationale as other API functions — URL strings, request shape, and
 * response envelope live in exactly one place, so a route rename or a new
 * field on the response touches nothing but this file.
 */
export function createSalonApi(
  input: CreateSalonFormValues,
): Promise<CreateSalonResponse> {
  return api.post<CreateSalonResponse>("/salons", input);
}
