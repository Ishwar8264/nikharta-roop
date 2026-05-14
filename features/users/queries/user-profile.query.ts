import "server-only";

import { createServerApiHeaders } from "@/features/api/server-api-headers";
import { handleGetProfile } from "@/features/users/handlers/user.handlers";
import type {
  ProfileResult,
  UserProfile,
} from "@/features/users/types/user-profile.types";

type ProfilePayload = {
  data?: {
    user?: UserProfile;
  };
  message?: string;
  success?: boolean;
};

// Wires Server Components to GET /api/v1/users/me/profile without browser fetch.
export async function getMyProfile(): Promise<ProfileResult> {
  const response = await handleGetProfile(
    new Request("http://nikharta-roop.local/api/v1/users/me/profile", {
      headers: await createServerApiHeaders(),
      method: "GET",
    }),
  );
  const payload = (await response.json().catch(() => null)) as
    | ProfilePayload
    | null;

  if (!response.ok || payload?.success !== true) {
    return {
      error: payload?.message ?? "Could not load profile.",
      user: null,
    };
  }

  return {
    error: null,
    user: payload.data?.user ?? null,
  };
}
