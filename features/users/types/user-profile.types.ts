export type UserProfile = {
  avatarUrl: string | null;
  branchId: string | null;
  email: string | null;
  id: string;
  mobile: string;
  mobileVerifiedAt: string | null;
  name: string | null;
  notificationPreferences: unknown;
  profileCompletedAt: string | null;
  role: string;
};

export type ProfileResult = {
  error: string | null;
  user: UserProfile | null;
};

export type ProfileActionState = {
  message: string;
  success: boolean;
};
