import {
  AUTH_EVENT_CODES,
  AUTH_EVENT_MESSAGES,
} from "@/features/auth-events/constants/auth-event.constants";
import { authEventError } from "@/features/auth-events/responses/auth-event.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import { AuthEventVisibleError } from "./auth-event.shared";

/**
 * Converts expected and unexpected auth event failures into safe responses.
 */
export function handleAuthEventError(
  error: unknown,
  input: { code: string; handler: string; message: string },
) {
  if (error instanceof AuthEventVisibleError) {
    return authEventError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }
  console.error(input.code, { error, handler: input.handler });
  return authEventError({
    code: input.code,
    message: input.message,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Throws an auth event not-found error.
 */
export function throwAuthEventNotFound(): never {
  throw new AuthEventVisibleError(
    AUTH_EVENT_CODES.EVENT_NOT_FOUND,
    AUTH_EVENT_MESSAGES.EVENT_NOT_FOUND,
    HTTP_STATUS.NOT_FOUND,
  );
}
