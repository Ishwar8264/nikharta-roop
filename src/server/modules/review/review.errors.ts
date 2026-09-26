/** Thrown when a review does not exist or is not visible to the caller. */
export class ReviewNotFoundError extends Error {
  constructor() {
    super("Review not found");
    this.name = "ReviewNotFoundError";
  }
}

/** Thrown when the caller does not own the review. */
export class ReviewAccessDeniedError extends Error {
  constructor() {
    super("You can only modify your own review");
    this.name = "ReviewAccessDeniedError";
  }
}

/** Thrown when the target service does not exist. */
export class ReviewServiceNotFoundError extends Error {
  constructor() {
    super("Service not found");
    this.name = "ReviewServiceNotFoundError";
  }
}

/** Thrown when the target product does not exist. */
export class ReviewProductNotFoundError extends Error {
  constructor() {
    super("Product not found");
    this.name = "ReviewProductNotFoundError";
  }
}

/** Thrown when the target staff member does not exist. */
export class ReviewStaffNotFoundError extends Error {
  constructor() {
    super("Staff member not found");
    this.name = "ReviewStaffNotFoundError";
  }
}

/** Thrown when the appointment targeted for a staff rating is not eligible. */
export class ReviewAppointmentNotFoundError extends Error {
  constructor() {
    super("Appointment not found");
    this.name = "ReviewAppointmentNotFoundError";
  }
}

/** Thrown when the appointment has not been completed yet. */
export class ReviewAppointmentNotCompletedError extends Error {
  constructor() {
    super("Staff ratings are only allowed on completed appointments");
    this.name = "ReviewAppointmentNotCompletedError";
  }
}

/** Thrown when the caller is not the customer on the target appointment. */
export class ReviewNotAppointmentCustomerError extends Error {
  constructor() {
    super("Only the customer on the appointment can rate its staff");
    this.name = "ReviewNotAppointmentCustomerError";
  }
}

/** Thrown when a staff rating already exists for the given appointment. */
export class ReviewStaffRatingExistsError extends Error {
  constructor() {
    super("A staff rating already exists for this appointment");
    this.name = "ReviewStaffRatingExistsError";
  }
}

/** Thrown when the appointment has no assigned staff to rate. */
export class ReviewNoStaffToRateError extends Error {
  constructor() {
    super("This appointment has no assigned staff member");
    this.name = "ReviewNoStaffToRateError";
  }
}
