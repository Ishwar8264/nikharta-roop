/** Thrown when the requested staff member is not a member of the salon. */
export class StaffNotFoundError extends Error {
  constructor() {
    super("Staff member not found");
    this.name = "StaffNotFoundError";
  }
}

/** Thrown when the caller's role does not permit the operation. */
export class StaffRoleInsufficientError extends Error {
  constructor() {
    super("Your role does not permit this staff action");
    this.name = "StaffRoleInsufficientError";
  }
}

/** Thrown when the caller tries to change their own role or remove themselves. */
export class StaffSelfModificationError extends Error {
  constructor() {
    super("You cannot modify your own staff record through this endpoint");
    this.name = "StaffSelfModificationError";
  }
}

/** Thrown when a leave request overlaps an existing one for the same staff. */
export class StaffLeaveOverlapError extends Error {
  constructor() {
    super("This leave overlaps an existing leave for the same staff member");
    this.name = "StaffLeaveOverlapError";
  }
}

/** Thrown when the leave id does not belong to the target staff. */
export class StaffLeaveNotFoundError extends Error {
  constructor() {
    super("Leave request not found");
    this.name = "StaffLeaveNotFoundError";
  }
}

/** Thrown when a leave is already approved and cannot be cancelled. */
export class StaffLeaveAlreadyApprovedError extends Error {
  constructor() {
    super("Approved leaves must be cancelled by a manager");
    this.name = "StaffLeaveAlreadyApprovedError";
  }
}

/** Thrown when a service id supplied in skills does not belong to the salon. */
export class StaffSkillServiceMismatchError extends Error {
  constructor() {
    super("One or more services do not belong to this salon");
    this.name = "StaffSkillServiceMismatchError";
  }
}
