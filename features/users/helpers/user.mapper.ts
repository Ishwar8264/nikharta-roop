type ProfileUserRow = {
  avatarUrl: string | null;
  branchId: string | null;
  email: string | null;
  id: string;
  mobile: string;
  mobileVerifiedAt: Date | null;
  name: string | null;
  profileCompletedAt: Date | null;
  role: string;
};

/**
 * Converts a DB user row into the public profile API shape.
 */
export function toProfileUser(user: ProfileUserRow) {
  return {
    avatarUrl: user.avatarUrl,
    branchId: user.branchId,
    email: user.email,
    id: user.id,
    mobile: user.mobile,
    mobileVerifiedAt: user.mobileVerifiedAt,
    name: user.name,
    profileCompletedAt: user.profileCompletedAt,
    role: user.role,
  };
}
