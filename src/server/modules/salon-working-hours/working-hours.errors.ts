/** Thrown when a requested working-hours operation targets a missing salon. */
export class WorkingHoursSalonNotFoundError extends Error {
  constructor() {
    super("Salon not found");
    this.name = "WorkingHoursSalonNotFoundError";
  }
}
