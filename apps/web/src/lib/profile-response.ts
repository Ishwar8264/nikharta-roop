import "server-only";

import { Prisma } from "@nikharta-roop/db/client";
import { handlePrivateApiError, jsonError } from "./api-response";

/** Profile-specific database failures use actionable messages without exposing database details. */
export function handleProfileApiError(error: unknown): Response {
  const init = { headers: { "Cache-Control": "private, no-store" } };
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = error.meta?.target;
      const accountConflict = Array.isArray(target) && target.includes("userId");
      return jsonError(409, "CONFLICT", accountConflict
        ? "This account already has a profile. Update your existing profile instead."
        : "This profile slug is already in use. Choose another slug.", undefined, init);
    }
    if (error.code === "P2025") {
      return jsonError(404, "NOT_FOUND", "Profile not found, or you do not have permission to change it.", undefined, init);
    }
  }
  return handlePrivateApiError(error);
}
