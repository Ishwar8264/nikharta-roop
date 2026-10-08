import "server-only";

/** Thrown when a template key does not exist in the platform catalog. */
export class CatalogTemplateNotFoundError extends Error {
  constructor() {
    super("Catalog template not found");
    this.name = "CatalogTemplateNotFoundError";
  }
}

/** Thrown when a template is inactive and cannot be activated. */
export class CatalogTemplateInactiveError extends Error {
  constructor() {
    super("This template is not available for activation");
    this.name = "CatalogTemplateInactiveError";
  }
}
