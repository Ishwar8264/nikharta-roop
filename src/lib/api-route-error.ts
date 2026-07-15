import { ZodError } from "zod";

import { AppError } from "@/src/lib/errors";
import { ApiResponse } from "@/src/lib/response";

// Configure the safe fallback used for endpoint-specific authentication failures.
type ApiRouteErrorOptions = {
  fallbackMessage?: string;
  fallbackStatus?: number;
  logUnexpected?: boolean;
};

// Convert unknown route failures into one consistent and safe API envelope.
export const handleApiRouteError = (
  error: unknown,
  options: ApiRouteErrorOptions = {},
) => {
  // Preserve trusted messages and status codes from expected application errors.
  if (error instanceof AppError) {
    return ApiResponse.error(error.message, error.statusCode);
  }

  // Return the first actionable Zod issue instead of a serialized issue array.
  if (error instanceof ZodError) {
    return ApiResponse.error(error.issues[0]?.message ?? "Invalid request", 400);
  }

  // Distinguish malformed JSON from otherwise valid request validation failures.
  if (error instanceof SyntaxError) {
    return ApiResponse.error("Invalid JSON body", 400);
  }

  // Log unexpected failures unless the endpoint treats them as normal auth rejection.
  if (options.logUnexpected !== false) {
    console.error("Unhandled API route error", error);
  }

  // Use an endpoint-specific safe fallback when the caller provides one.
  return ApiResponse.error(
    options.fallbackMessage ?? "An unexpected error occurred",
    options.fallbackStatus ?? 500,
  );
};
