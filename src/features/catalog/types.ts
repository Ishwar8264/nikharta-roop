/**
 * Browser-safe mirrors of `src/server/modules/catalog/catalog.types.ts`.
 *
 * Why duplicated:
 * Server modules are `server-only`, so Client Components cannot import them.
 * Shapes live here, byte-for-byte identical, and a mirrored type keeps the
 * REST contract visible at the feature boundary.
 */
export interface PublicCatalogTemplate {
  id: string;
  key: string;
  kind: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
}

/** A salon's activation of a template, with the template embedded. */
export interface PublicSalonTemplate {
  id: string;
  templateId: string;
  price: number;
  isActive: boolean;
  template: PublicCatalogTemplate;
}

/** One mergeable row for the activation grid. */
export interface ActivationRow {
  template: PublicCatalogTemplate;
  /** null until the salon activates the template. */
  activation: {
    price: number;
    isActive: boolean;
  } | null;
}
