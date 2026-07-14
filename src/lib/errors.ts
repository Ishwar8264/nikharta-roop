/**
 * ========================================================
 * CUSTOM ERROR CLASSES
 * Standardized error types for consistent API error handling.
 * Each error extends the native Error class and includes an HTTP status code.
 * ========================================================
 */

/**
 * Base custom error class that all other errors extend.
 * Accepts a message and an optional HTTP status code (defaults to 500).
 */
export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Represents a 409 Conflict error.
 * Used when a resource already exists (e.g., user already registered).
 */
export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict occurred") {
    super(message, 409);
  }
}

/**
 * Represents a 401 Unauthorized error.
 * Used for authentication failures (invalid OTP, invalid token).
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = "Unauthorized access") {
    super(message, 401);
  }
}

/**
 * Represents a 400 Bad Request error.
 * Used for validation errors or missing data.
 */
export class BadRequestError extends AppError {
  constructor(message: string = "Bad request") {
    super(message, 400);
  }
}

/**
 * Represents a 404 Not Found error.
 * Used when a requested resource does not exist.
 */
export class NotFoundError extends AppError {
  constructor(message: string = "Resource not found") {
    super(message, 404);
  }
}

/**
 * Represents a 429 Too Many Requests error.
 * Used when an authentication request exceeds its configured rate limit.
 */
export class TooManyRequestsError extends AppError {
  constructor(message: string = "Too many requests. Please try again later.") {
    super(message, 429);
  }
}

/**
 * Represents a 503 Service Unavailable error.
 * Used when an external OTP delivery provider is not configured or unavailable.
 */
export class ServiceUnavailableError extends AppError {
  constructor(message: string = "Authentication service is temporarily unavailable") {
    super(message, 503);
  }
}
