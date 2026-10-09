import { api } from "@/lib/api/backend.client";

import type { PublicCatalogTemplate, PublicSalonTemplate } from "./types";

/** Activates a catalog template for the salon with the salon's own price. */
export function activateTemplateApi(
  salonRef: string,
  input: { templateKey: string; price: number },
) {
  return api.post<{
    message: string;
    data: { template: PublicSalonTemplate };
  }>(
    `/salons/${encodeURIComponent(salonRef)}/templates`,
    input,
  );
}

/** Updates a salon's activation (price and/or on/off). */
export function updateActivationApi(
  salonRef: string,
  templateKey: string,
  input: { price?: number; isActive?: boolean },
) {
  return api.patch<{
    message: string;
    data: { template: PublicSalonTemplate };
  }>(
    `/salons/${encodeURIComponent(salonRef)}/templates/${encodeURIComponent(templateKey)}`,
    input,
  );
}

/** Removes a salon's template activation. */
export function deactivateTemplateApi(salonRef: string, templateKey: string) {
  return api.delete<{ message: string; data: null }>(
    `/salons/${encodeURIComponent(salonRef)}/templates/${encodeURIComponent(templateKey)}`,
  );
}

/** Catalog template row — mirrors the server type without importing it. */
export type { PublicCatalogTemplate, PublicSalonTemplate };
