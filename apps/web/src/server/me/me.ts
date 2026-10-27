import "server-only";

import type { MeResponse } from "@nikharta-roop/shared";
import { getActiveSession } from "@/server/auth-guard";
import { AppError } from "@/server/errors";
import { checkRateLimit } from "@/server/rate-limit";

/** Return current DB account fields rather than potentially stale identity data cached in Redis. */
export async function getMe(request: Request): Promise<MeResponse> {
  // The deployment must replace untrusted forwarding headers before they reach the app.
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const limit = await checkRateLimit(`me:${ip}`);
  if (!limit.success)
    throw new AppError("Too many requests. Please try again shortly.", "RATE_LIMITED", 429);

  const context = await getActiveSession(request.headers);
  if (!context)
    throw new AppError(
      "Sign in with an active, verified account to continue.",
      "UNAUTHORIZED",
      401,
    );

  const { id, name, email, emailVerified, image, role } = context.user;
  return { user: { id, name, email, emailVerified, image, role } };
}
