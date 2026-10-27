import type { UserProfileStatus } from "../enums";

/** Selected profile display fields; internal ownership and auth data are never included. */
export type UserProfile = {
  id: string;
  status: UserProfileStatus;
  slug: string;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
};

export type CreateProfileResponse = { profile: UserProfile };
