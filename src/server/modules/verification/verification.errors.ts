import "server-only";

export class VerificationValidationError extends Error {}
export class VerificationConflictError extends Error {
  constructor() {
    super(
      "This submission changed or was already reviewed. Reload before continuing.",
    );
  }
}

/** Thrown when a salon has no verification row yet. */
export class SalonVerificationNotFoundError extends Error {
  constructor() {
    super("Verification not found");
    this.name = "SalonVerificationNotFoundError";
  }
}

/** Thrown when the salon is already verified and cannot resubmit. */
export class SalonAlreadyVerifiedError extends Error {
  constructor() {
    super("This salon is already verified");
    this.name = "SalonAlreadyVerifiedError";
  }
}

/** Thrown when a suspended salon tries to submit without admin action. */
export class SalonVerificationSuspendedError extends Error {
  constructor() {
    super("This salon's listing is suspended; contact support");
    this.name = "SalonVerificationSuspendedError";
  }
}
