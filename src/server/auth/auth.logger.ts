import "server-only";

import { randomUUID } from "node:crypto";

type AuthLogValue = boolean | number | string | null | undefined;

interface AuthLogContext {
  [key: string]: AuthLogValue;
}

/** Creates a correlation id for one auth request without exposing credentials. */
export function createAuthRequestId(request: Request): string {
  const suppliedId = request.headers.get("x-request-id")?.trim();

  // Only accept a small, log-safe character set from an upstream proxy.
  if (suppliedId && /^[a-zA-Z0-9._:-]{1,128}$/.test(suppliedId)) {
    return suppliedId;
  }

  return randomUUID();
}

/** Writes one structured auth event that production log systems can index. */
export function logAuthEvent(
  level: "info" | "warn",
  event: string,
  context: AuthLogContext = {},
): void {
  writeAuthLog(level, event, context);
}

/** Writes a structured auth failure while keeping secrets and stacks out of production. */
export function logAuthError(
  event: string,
  error: unknown,
  context: AuthLogContext = {},
): void {
  const errorContext: AuthLogContext = {
    ...context,
    errorName: error instanceof Error ? error.name : "UnknownError",
    // Infrastructure errors may embed SQL, URLs, or provider response data.
    // Keep their message available locally, but never ship it to production.
    errorMessage:
      process.env.NODE_ENV !== "production"
        ? error instanceof Error
          ? error.message
          : String(error)
        : undefined,
  };

  const payload = buildPayload("error", event, errorContext);

  if (process.env.NODE_ENV !== "production" && error instanceof Error) {
    console.error(JSON.stringify({ ...payload, stack: error.stack }));
    return;
  }

  console.error(JSON.stringify(payload));
}

/** Builds and emits a stable JSON envelope shared by every auth event. */
function writeAuthLog(
  level: "info" | "warn",
  event: string,
  context: AuthLogContext,
): void {
  const message = JSON.stringify(buildPayload(level, event, context));

  if (level === "warn") {
    console.warn(message);
    return;
  }

  console.info(message);
}

/** Removes undefined values and line breaks before data reaches the log sink. */
function buildPayload(
  level: "info" | "warn" | "error",
  event: string,
  context: AuthLogContext,
): Record<string, AuthLogValue> {
  const payload: Record<string, AuthLogValue> = {
    timestamp: new Date().toISOString(),
    level,
    scope: "auth",
    event: sanitize(event),
  };

  for (const [key, value] of Object.entries(context)) {
    if (value === undefined) continue;
    payload[key] = typeof value === "string" ? sanitize(value) : value;
  }

  return payload;
}

/** Prevents user-controlled line breaks from forging additional log entries. */
function sanitize(value: string): string {
  return value.replace(/[\r\n\t]/g, " ").slice(0, 500);
}
