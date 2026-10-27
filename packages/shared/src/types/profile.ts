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

export type ListProfilesResponse = {
  items: UserProfile[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
export type UpdateProfileResponse = { profile: UserProfile };
