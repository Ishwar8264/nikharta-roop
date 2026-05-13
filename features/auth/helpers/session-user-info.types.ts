import type { AuthUser } from "@/features/auth/actions/auth-action.types";

export type SessionUserInfo = {
  branchId: string | null;
  displayName: string;
  email: string | null;
  initials: string;
  isAdmin: boolean;
  isAuthenticated: boolean;
  isCustomer: boolean;
  isStaff: boolean;
  isSuperAdmin: boolean;
  mobile: string | null;
  role: string | null;
  user: AuthUser | null;
  userId: string | null;
};
