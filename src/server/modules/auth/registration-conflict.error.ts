/** Represents a registration identifier rejected by a uniqueness rule. */
export class RegistrationConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RegistrationConflictError";
  }
}
