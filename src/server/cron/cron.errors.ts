/** Thrown when a cron invocation presents a missing or invalid secret. */
export class CronUnauthorizedError extends Error {
  constructor() {
    super("Invalid cron secret");
    this.name = "CronUnauthorizedError";
  }
}

/** Thrown when a job cannot acquire its distributed lock. */
export class CronLockUnavailableError extends Error {
  constructor(jobName: string) {
    super(`Cron job "${jobName}" is already running on another instance`);
    this.name = "CronLockUnavailableError";
  }
}

/** Thrown when a job's handler exceeds its own time budget. */
export class CronTimeoutApproachingError extends Error {
  constructor(jobName: string, processed: number) {
    super(
      `Cron job "${jobName}" reached its time budget after processing ${processed} items`,
    );
    this.name = "CronTimeoutApproachingError";
  }
}
