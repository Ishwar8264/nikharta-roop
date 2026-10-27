import "server-only";

import {
  createProfileSchema,
  updateProfileSchema,
  type CreateProfileResponse,
  type GetProfileResponse,
  type UpdateProfileResponse,
} from "@nikharta-roop/shared";
import { auth } from "@/server/auth";
import { getActiveSession } from "@/server/auth-guard";
import { createProfileRecord, deleteProfileRecord, findProfileRecord, updateProfileRecord } from "@/server/db";
import { AppError } from "@/server/errors";
import { checkRateLimit } from "@/server/rate-limit";

/** Apply the same session and rate-limit policy to every personal-profile operation. */
async function requireProfileSession(request: Request) {
  const clientIp = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "anonymous";
  const rateLimit = await checkRateLimit(`profile:${clientIp}`);
  if (!rateLimit.success)
    throw new AppError("Too many requests. Please try again shortly.", "RATE_LIMITED", 429);

  const activeSession = await getActiveSession(request.headers);
  if (!activeSession)
    throw new AppError(
      "Sign in with an active, verified account to continue.",
      "UNAUTHORIZED",
      401,
    );

  return activeSession;
}

/** SameSite cookies alone are insufficient for same-site subdomain requests. */
async function requireProfileOrigin(request: Request): Promise<void> {
  const requestOrigin = request.headers.get("origin");
  const authConfiguration = await auth.$context;
  if (!requestOrigin || !authConfiguration.isTrustedOrigin(requestOrigin)) {
    throw new AppError("This request origin is not allowed.", "INVALID_ORIGIN", 403);
  }
}

async function readProfileBody(request: Request): Promise<unknown> {
  await requireProfileOrigin(request);
  const contentType = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (contentType !== "application/json") {
    throw new AppError("Send an application/json request body.", "UNSUPPORTED_MEDIA_TYPE", 415);
  }
  let requestBody: unknown;
  try {
    requestBody = await request.json();
  } catch {
    throw new AppError("Send a valid JSON request body.", "INVALID_JSON", 400);
  }

  return requestBody;
}

/** Create only the signed-in account's public profile. */
export async function createProfile(request: Request): Promise<CreateProfileResponse> {
  const activeSession = await requireProfileSession(request);
  const profileInput = createProfileSchema.parse(await readProfileBody(request));
  return { profile: await createProfileRecord(activeSession.user.id, profileInput) };
}

/** Return the signed-in account's profile, including its current lifecycle status. */
export async function getProfile(request: Request): Promise<GetProfileResponse> {
  const activeSession = await requireProfileSession(request);
  const profile = await findProfileRecord(activeSession.user.id);
  if (!profile) throw new AppError("Your profile was not found.", "NOT_FOUND", 404);
  return { profile };
}

/** Update display details without allowing changes to ownership or lifecycle status. */
export async function updateProfile(request: Request, slug: string): Promise<UpdateProfileResponse> {
  const activeSession = await requireProfileSession(request);
  const profileSlug = createProfileSchema.shape.slug.parse(slug);
  const profileInput = updateProfileSchema.parse(await readProfileBody(request));
  return { profile: await updateProfileRecord(activeSession.user.id, profileSlug, profileInput) };
}

/** Only the current database ADMIN role can permanently remove a profile. */
export async function deleteProfile(request: Request, slug: string): Promise<void> {
  const activeSession = await requireProfileSession(request);
  if (activeSession.user.role !== "ADMIN") {
    throw new AppError("Only administrators can delete profiles.", "FORBIDDEN", 403);
  }
  await requireProfileOrigin(request);
  const profileSlug = createProfileSchema.shape.slug.parse(slug);
  await deleteProfileRecord(profileSlug);
}
