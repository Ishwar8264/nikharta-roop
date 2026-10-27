import "server-only";

import { fail, ok } from "@nikharta-roop/shared";
import { Prisma } from "@nikharta-roop/db/client";
import { APIError } from "better-auth/api";
import { z } from "zod";
import { AppError } from "@/server/errors";

export const jsonOk = <T>(data: T, init?: ResponseInit, message?: string) =>
  Response.json(ok(data, message), init);

export const jsonError = (
  status: number,
  code: string,
  message: string,
  details?: unknown,
  init?: ResponseInit,
) => Response.json(fail(code, message, details), { ...init, status });

/** Map domain errors only. Native /auth routes must not wrap their responses. */
export function handleApiError(error: unknown, init?: ResponseInit): Response {
  if (error instanceof z.ZodError) {
    return jsonError(
      400,
      "VALIDATION_ERROR",
      "Please check the supplied values.",
      z.treeifyError(error),
      init,
    );
  }
  if (error instanceof AppError)
    return jsonError(error.status, error.code, error.message, undefined, init);
  if (error instanceof APIError) {
    return jsonError(
      error.statusCode,
      error.body?.code ?? "AUTH_ERROR",
      error.body?.message ?? "Authentication failed.",
      undefined,
      init,
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002")
      return jsonError(
        409,
        "CONFLICT",
        "A record with this information already exists.",
        undefined,
        init,
      );
    if (error.code === "P2025")
      return jsonError(404, "NOT_FOUND", "The requested record was not found.", undefined, init);
    if (error.code === "P2034")
      return jsonError(
        409,
        "CONFLICT",
        "Data changed concurrently. Please retry.",
        undefined,
        init,
      );
  }
  return jsonError(500, "INTERNAL_ERROR", "Something went wrong.", undefined, init);
}
