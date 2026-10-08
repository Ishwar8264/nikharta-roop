import "server-only";

/** Thrown when a package does not exist (or is not visible to the caller). */
export class PackageNotFoundError extends Error {
  constructor() {
    super("Package not found");
    this.name = "PackageNotFoundError";
  }
}

/** Thrown when the requested package slug is already taken inside the salon. */
export class PackageSlugConflictError extends Error {
  constructor() {
    super("A package with this slug already exists");
    this.name = "PackageSlugConflictError";
  }
}

/** Thrown when a service referenced by a package does not belong to the salon. */
export class PackageServiceMismatchError extends Error {
  constructor() {
    super("One or more services do not belong to this salon");
    this.name = "PackageServiceMismatchError";
  }
}
