/** Thrown when the identifier provided does not match any non-deleted user. */
export class UserNotFoundError extends Error {
  constructor() {
    super("If the email exists, a reset code has been sent");
    this.name = "UserNotFoundError";
  }
}

/** Thrown when the new password matches the current one. */
export class PasswordUnchangedError extends Error {
  constructor() {
    super("New password must be different from the current one");
    this.name = "PasswordUnchangedError";
  }
}
