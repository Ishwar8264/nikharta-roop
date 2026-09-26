/** Thrown when an audit log entry does not exist. */
export class AuditLogNotFoundError extends Error {
  constructor() {
    super("Audit log entry not found");
    this.name = "AuditLogNotFoundError";
  }
}

/** Thrown when the caller lacks the SUPER_ADMIN role. */
export class AuditLogAccessDeniedError extends Error {
  constructor() {
    super("Only platform administrators can read audit logs");
    this.name = "AuditLogAccessDeniedError";
  }
}
