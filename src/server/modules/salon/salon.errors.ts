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

/** Thrown when another salon already uses the selected map place. */
export class SalonPlaceConflictError extends Error {
  constructor() {
    super("A salon already exists at this selected place");
    this.name = "SalonPlaceConflictError";
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

/** Publication requires current verification, including unchanged business identity. */
export class SalonPublicationBlockedError extends Error {
  constructor() {
    super("Complete salon verification before going live. Identity or location changes require a new review.");
    this.name = "SalonPublicationBlockedError";
  }
}

/** Missing and deleted accounts share an error to avoid exposing account history. */
export class SalonMemberAccountUnavailableError extends Error {
  constructor() {
    super("No eligible account found. Ask the staff member to register first.");
    this.name = "SalonMemberAccountUnavailableError";
  }
}

/** The member chose a slug already used by another member of the same salon. */
export class SalonMemberSlugConflictError extends Error {
  constructor() {
    super("This member slug is already in use in this salon");
    this.name = "SalonMemberSlugConflictError";
  }
}
