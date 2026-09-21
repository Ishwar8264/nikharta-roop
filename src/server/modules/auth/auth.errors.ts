/**
 * Thrown when login fails for any reason (unknown user, wrong password,
 * missing password on the account).
 *
 * Why:
 * One error type for all failure modes means the route can return a single
 * generic message, preventing user enumeration via error text.
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid email or password");
    this.name = "InvalidCredentialsError";
  }
}

/** Thrown when the account exists but the identifier has not been verified. */
export class EmailNotVerifiedError extends Error {
  constructor() {
    super("Please verify your email before signing in");
    this.name = "EmailNotVerifiedError";
  }
}

/** Thrown when the user has been soft-deleted. */
export class AccountDeactivatedError extends Error {
  constructor() {
    super("This account has been deactivated");
    this.name = "AccountDeactivatedError";
  }
}
