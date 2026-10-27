import "server-only";

import { createProfileSchema, type CreateProfileResponse } from "@nikharta-roop/shared";
import { auth } from "@/server/auth";
import { getActiveSession } from "@/server/auth-guard";
import { createProfileRecord } from "@/server/db";
import { AppError } from "@/server/errors";
import { checkRateLimit } from "@/server/rate-limit";

/** Create only the signed-in account's personal profile; no other account or salon can be supplied. */
export async function createProfile(request: Request): Promise<CreateProfileResponse> {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const budget = await checkRateLimit(`profile-create:${ip}`);
  if (!budget.success)
    throw new AppError("Too many requests. Please try again shortly.", "RATE_LIMITED", 429);

  const context = await getActiveSession(request.headers);
  if (!context)
    throw new AppError(
      "Sign in with an active, verified account to continue.",
      "UNAUTHORIZED",
      401,
    );

  // SameSite cookies alone are insufficient for same-site subdomain requests.
  const origin = request.headers.get("origin");
  const authContext = await auth.$context;
  if (!origin || !authContext.isTrustedOrigin(origin)) {
    throw new AppError("This request origin is not allowed.", "INVALID_ORIGIN", 403);
  }
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new AppError("Send an application/json request body.", "UNSUPPORTED_MEDIA_TYPE", 415);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new AppError("Send a valid JSON request body.", "INVALID_JSON", 400);
  }

  const input = createProfileSchema.parse(body);
  return { profile: await createProfileRecord(context.user.id, input) };
}
