/**
 * Client-side API wrappers for the profile feature.
 *
 * Why a dedicated module:
 * The `auth` feature folder owns the sign-in / register / OTP flows. Profile
 * updates are a separate concern (an already-authenticated user editing
 * their own record), so the calls live here to keep the auth folder focused
 * on entry flows. Both still hit the same `/auth/me` REST route.
 */

import { api } from "@/lib/api/backend.client";

import type { UserProfile, UpdateProfileBody } from "./types";

type MeResponse = { message: string; data: { user: UserProfile } };

/** Updates the authenticated user's editable profile fields. */
export function updateProfileApi(body: UpdateProfileBody) {
  return api.patch<MeResponse>("/auth/me", body);
}
