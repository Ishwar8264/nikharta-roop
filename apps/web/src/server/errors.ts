import "server-only";

/** Only intentional, caller-safe errors belong in the public API envelope. */
export class AppError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}
