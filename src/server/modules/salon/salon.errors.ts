/** Thrown when the requested salon does not exist or was soft-deleted. */
export class SalonNotFoundError extends Error {
  constructor() {
    super("Salon not found");
    this.name = "SalonNotFoundError";
  }
}

/** Thrown when the caller is not a member of the target salon. */
export class SalonAccessDeniedError extends Error {
  constructor() {
    super("You do not have access to this salon");
    this.name = "SalonAccessDeniedError";
  }
}

/** Thrown when the caller's salon role is insufficient for the operation. */
export class SalonRoleInsufficientError extends Error {
  constructor() {
    super("Your salon role does not permit this action");
    this.name = "SalonRoleInsufficientError";
  }
}

/** Thrown when a slug cannot be made unique after several retries. */
export class SlugConflictError extends Error {
  constructor() {
    super("Unable to reserve a unique slug for this salon");
    this.name = "SlugConflictError";
  }
}

/** Thrown when the target user is already a member of the salon. */
export class SalonMemberExistsError extends Error {
  constructor() {
    super("This user is already a member of the salon");
    this.name = "SalonMemberExistsError";
  }
}

/** Thrown when an operation would remove the last OWNER of a salon. */
export class LastOwnerRemovalError extends Error {
  constructor() {
    super("The last owner of a salon cannot be removed");
    this.name = "LastOwnerRemovalError";
  }
}
