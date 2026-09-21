/** Thrown when the caller requests a new OTP before the cooldown elapsed. */
export class OtpCooldownError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super(
      `Please wait ${retryAfterSeconds} seconds before requesting a new code`,
    );
    this.name = "OtpCooldownError";
  }
}

/** Thrown when the code is wrong, missing, or already used. */
export class OtpInvalidError extends Error {
  constructor() {
    super("Invalid or expired code");
    this.name = "OtpInvalidError";
  }
}

/** Thrown when the code exists but its TTL has passed. */
export class OtpExpiredError extends Error {
  constructor() {
    super("Code has expired. Please request a new one.");
    this.name = "OtpExpiredError";
  }
}

/** Thrown when the per-OTP attempt budget is exhausted. */
export class OtpMaxAttemptsError extends Error {
  constructor() {
    super("Too many incorrect attempts. Please request a new code.");
    this.name = "OtpMaxAttemptsError";
  }
}

/** Thrown when the email provider rejects the message. */
export class OtpDeliveryError extends Error {
  constructor() {
    super("Unable to send verification code. Please try again.");
    this.name = "OtpDeliveryError";
  }
}
