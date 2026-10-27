import { z } from "zod";

export const CATALOG_STATUSES = ["DRAFT", "PUBLISHED", "PAUSED", "ARCHIVED"] as const;
export type CatalogStatus = (typeof CATALOG_STATUSES)[number];
export const catalogStatusSchema = z.enum(CATALOG_STATUSES);
export const CATALOG_STATUS_LABELS: Record<CatalogStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  PAUSED: "Paused",
  ARCHIVED: "Archived",
};

/** Keeps legacy availability aligned with the persisted publication status. */
export function resolveCatalogStatus(input: {
  status?: CatalogStatus;
  isActive?: boolean;
}): CatalogStatus {
  return (
    input.status ??
    (input.isActive === undefined ? "DRAFT" : input.isActive ? "PUBLISHED" : "PAUSED")
  );
}
