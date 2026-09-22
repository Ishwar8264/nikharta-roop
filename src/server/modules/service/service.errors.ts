/** Thrown when the requested service does not exist or was soft-deleted. */
export class ServiceNotFoundError extends Error {
  constructor() {
    super("Service not found");
    this.name = "ServiceNotFoundError";
  }
}

/** Thrown when a service category does not exist. */
export class ServiceCategoryNotFoundError extends Error {
  constructor() {
    super("Service category not found");
    this.name = "ServiceCategoryNotFoundError";
  }
}

/** Thrown when a service slug collides within the same salon. */
export class ServiceSlugConflictError extends Error {
  constructor() {
    super("A service with this slug already exists in this salon");
    this.name = "ServiceSlugConflictError";
  }
}

/** Thrown when a global category slug collides. */
export class ServiceCategorySlugConflictError extends Error {
  constructor() {
    super("A service category with this slug already exists");
    this.name = "ServiceCategorySlugConflictError";
  }
}
