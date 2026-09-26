/** Thrown when a target user does not exist. */
export class AdminUserNotFoundError extends Error {
  constructor() {
    super("User not found");
    this.name = "AdminUserNotFoundError";
  }
}

/** Thrown when an admin tries to demote themselves or another super admin. */
export class AdminSelfDemotionError extends Error {
  constructor() {
    super("You cannot change your own platform role");
    this.name = "AdminSelfDemotionError";
  }
}

/** Thrown when a role assignment would leave the platform without any super admins. */
export class AdminLastSuperAdminError extends Error {
  constructor() {
    super("The last SUPER_ADMIN cannot be demoted");
    this.name = "AdminLastSuperAdminError";
  }
}

/** Thrown when a quota limit is below the amount already used. */
export class AdminQuotaBelowUsageError extends Error {
  constructor(scope: string, used: number) {
    super(
      `New ${scope} limit cannot be below the amount already used (${used})`,
    );
    this.name = "AdminQuotaBelowUsageError";
  }
}

/** Thrown when the caller does not hold the SUPER_ADMIN role. */
export class AdminAccessDeniedError extends Error {
  constructor() {
    super("Only platform administrators can perform this action");
    this.name = "AdminAccessDeniedError";
  }
}
