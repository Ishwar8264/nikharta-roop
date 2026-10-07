/** Thrown when the requested appointment does not exist. */
export class AppointmentNotFoundError extends Error {
  constructor() {
    super("Appointment not found");
    this.name = "AppointmentNotFoundError";
  }
}

/** Thrown when the caller is not allowed to access/modify the appointment. */
export class AppointmentAccessDeniedError extends Error {
  constructor() {
    super("You do not have access to this appointment");
    this.name = "AppointmentAccessDeniedError";
  }
}

/** Thrown when the requested services do not all belong to the salon. */
export class AppointmentServiceMismatchError extends Error {
  constructor() {
    super("One or more services do not belong to this salon");
    this.name = "AppointmentServiceMismatchError";
  }
}

/** Thrown when a service is inactive or soft-deleted. */
export class AppointmentServiceUnavailableError extends Error {
  constructor() {
    super("One or more services are not available for booking");
    this.name = "AppointmentServiceUnavailableError";
  }
}

/** Thrown when the assigned staff cannot perform a requested service. */
export class AppointmentStaffSkillMismatchError extends Error {
  constructor() {
    super("The assigned staff member cannot perform one or more services");
    this.name = "AppointmentStaffSkillMismatchError";
  }
}

/** Thrown when the requested slot is outside salon working hours. */
export class AppointmentOutsideSalonHoursError extends Error {
  constructor() {
    super("The requested time is outside salon working hours");
    this.name = "AppointmentOutsideSalonHoursError";
  }
}

/** Thrown when the requested slot is outside the staff's scheduled hours. */
export class AppointmentOutsideStaffHoursError extends Error {
  constructor() {
    super("The requested time is outside the staff member's scheduled hours");
    this.name = "AppointmentOutsideStaffHoursError";
  }
}

/** Thrown when the requested slot overlaps an approved staff leave. */
export class AppointmentStaffOnLeaveError extends Error {
  constructor() {
    super("The assigned staff member is on leave at the requested time");
    this.name = "AppointmentStaffOnLeaveError";
  }
}

/** Thrown when the slot is already taken by another appointment. */
export class AppointmentSlotTakenError extends Error {
  constructor() {
    super("The requested time slot is no longer available");
    this.name = "AppointmentSlotTakenError";
  }
}

/** Thrown when a status transition is not allowed from the current state. */
export class AppointmentInvalidTransitionError extends Error {
  constructor(from: string, to: string) {
    super(`Cannot change status from ${from} to ${to}`);
    this.name = "AppointmentInvalidTransitionError";
  }
}

/** Thrown when the caller tries to act on an appointment in a terminal state. */
export class AppointmentTerminalStateError extends Error {
  constructor() {
    super("This appointment is in a final state and cannot be modified");
    this.name = "AppointmentTerminalStateError";
  }
}

/** Thrown when the requested staff member is not part of the salon. */
export class AppointmentStaffNotFoundError extends Error {
  constructor() {
    super("Staff member not found in this salon");
    this.name = "AppointmentStaffNotFoundError";
  }
}

/** Thrown when start time is in the past. */
export class AppointmentStartTimeInPastError extends Error {
  constructor() {
    super("Appointment start time must be in the future");
    this.name = "AppointmentStartTimeInPastError";
  }
}

/** Thrown when payment already exists for the appointment. */
export class PaymentAlreadyExistsError extends Error {
  constructor() {
    super("Payment already recorded for this appointment");
    this.name = "PaymentAlreadyExistsError";
  }
}

/** Thrown when payment does not exist yet. */
export class PaymentNotFoundError extends Error {
  constructor() {
    super("Payment not found");
    this.name = "PaymentNotFoundError";
  }
}

/** Thrown when a recorded payment amount does not match the appointment total. */
export class PaymentAmountMismatchError extends Error {
  constructor() {
    super("Payment amount must match the appointment total");
    this.name = "PaymentAmountMismatchError";
  }
}
