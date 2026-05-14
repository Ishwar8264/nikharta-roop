import type { AuthUser } from "@/features/auth/actions/auth-action.types";
import type { SessionUserInfo } from "@/features/auth/helpers/session-user-info.types";

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);

export function buildSessionUserInfo(user: AuthUser | null): SessionUserInfo {
  const role = user?.role ?? null;
  const displayName = user?.name?.trim() || user?.mobile || "Account";

  return {
    avatarUrl: user?.avatarUrl ?? null,
    branchId: null,
    displayName,
    email: user?.email ?? null,
    initials: getInitials(displayName),
    isAdmin: Boolean(role && ADMIN_ROLES.has(role)),
    isAuthenticated: Boolean(user),
    isCustomer: role === "USER",
    isStaff: role === "STAFF",
    isSuperAdmin: role === "SUPER_ADMIN",
    mobile: user?.mobile ?? null,
    role,
    user,
    userId: user?.id ?? null,
  };
}

function getInitials(value: string) {
  const cleanedValue = value.trim();

  if (!cleanedValue) {
    return "NR";
  }

  const words = cleanedValue.split(/\s+/).filter(Boolean);

  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return cleanedValue.slice(0, 2).toUpperCase();
}
