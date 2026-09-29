import "server-only";

import { NextResponse } from "next/server";

type LogValue = boolean | number | string | null | undefined;

/** Writes structured API diagnostics only while developing locally. */
export function logDevApiEvent(
  event: string,
  context: Record<string, LogValue> = {},
): void {
  if (process.env.NODE_ENV === "production") return;
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "debug",
      scope: "api",
      event,
      ...context,
    }),
  );
}

/** Returns useful local diagnostics without leaking internals in production. */
export function unexpectedApiError(
  event: string,
  error: unknown,
  fallbackMessage: string,
): NextResponse {
  const development = process.env.NODE_ENV !== "production";
  const details =
    error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : { name: "UnknownError", message: String(error), stack: undefined };

  console.error(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "error",
      scope: "api",
      event,
      errorName: details.name,
      ...(development
        ? { errorMessage: details.message, stack: details.stack }
        : {}),
    }),
  );

  return NextResponse.json(
    {
      message: development ? details.message || fallbackMessage : fallbackMessage,
      ...(development
        ? { debug: { event, errorName: details.name, stack: details.stack } }
        : {}),
    },
    { status: 500 },
  );
}
