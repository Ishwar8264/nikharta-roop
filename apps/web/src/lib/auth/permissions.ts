/** Platform permissions never confer membership of an individual salon. */
export const PLATFORM_ROLES = ["USER", "CONTENT_ADMIN", "ADMIN", "SUPER_ADMIN"] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];
export type PlatformPermission = "content.manage" | "salons.verify" | "users.manage" | "roles.assign" | "platform.manage";

const grants: Record<PlatformRole, readonly PlatformPermission[]> = {
  USER: [],
  CONTENT_ADMIN: ["content.manage"],
  ADMIN: ["content.manage", "salons.verify", "users.manage"],
  SUPER_ADMIN: ["content.manage", "salons.verify", "users.manage", "roles.assign", "platform.manage"],
};

export function isPlatformRole(role: string): role is PlatformRole {
  return PLATFORM_ROLES.some((value) => value === role);
}

/** Unknown roles fail closed; UI and server checks use the same policy. */
export function hasPermission(role: string, permission: PlatformPermission): boolean {
  return isPlatformRole(role) && grants[role].includes(permission);
}

export function canAccessAdmin(role: string): boolean {
  return isPlatformRole(role) && grants[role].length > 0;
}

export function adminDestination(role: string): string {
  return hasPermission(role, "salons.verify") ? "/admin/salons/verification" : "/blog";
}
