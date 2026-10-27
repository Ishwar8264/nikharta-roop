import type { ProfileStatus, ProfileType } from "../enums";

/** Selected profile display fields; internal ownership and auth data are never included. */
export type Profile = {
  id: string;
  type: ProfileType;
  status: ProfileStatus;
  slug: string;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
};

export type CreateProfileResponse = { profile: Profile };
