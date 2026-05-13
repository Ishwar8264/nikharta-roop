import { z } from "zod";

import {
  AUTH_EVENT_CODES,
  AUTH_EVENT_MESSAGES,
} from "@/features/auth-events/constants/auth-event.constants";
import type { AuthEventRow } from "@/features/auth-events/helpers/auth-event.mapper";
import { toPublicAuthEvent } from "@/features/auth-events/helpers/auth-event.mapper";
import {
  authEventError,
  authEventJson,
} from "@/features/auth-events/responses/auth-event.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";

/**
 * Parses auth event query strings with feature-owned validation errors.
 */
export function parseAuthEventQuery<TSchema extends z.ZodTypeAny>(
  request: Request,
  schema: TSchema,
) {
  const parsed = schema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (parsed.success) {
    return { data: parsed.data as z.output<TSchema>, success: true as const };
  }
  return {
    error: authEventError({
      code: AUTH_EVENT_CODES.VALIDATION_ERROR,
      message: AUTH_EVENT_MESSAGES.VALIDATION_ERROR,
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    }),
    success: false as const,
  };
}

/**
 * Wraps an auth event collection in the shared response shape.
 */
export function authEventListResponse(events: AuthEventRow[], limit: number) {
  return authEventJson({
    code: AUTH_EVENT_CODES.EVENT_LISTED,
    data: { events: events.map(toPublicAuthEvent), limit },
    message: AUTH_EVENT_MESSAGES.EVENT_LISTED,
    status: HTTP_STATUS.OK,
    success: true,
  });
}
