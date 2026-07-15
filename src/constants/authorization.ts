// Load the generated Prisma role union so policy drift becomes a compile error.
import type { UserRole as PrismaUserRole } from "@prisma/client";

// Reuse the generated schema role union without duplicating authorization values.
export type UserRole = PrismaUserRole;

// Describe one protected URL family and every role allowed to render it.
export type RoutePolicy = {
  // Match the exact protected route and all of its nested paths.
  pathname: string;
  // Keep authorization explicit instead of deriving it from navigation visibility.
  roles: readonly UserRole[];
};

// Map every authenticated role to its safe landing page after forbidden navigation.
export const ROLE_HOME_PATHS: Record<UserRole, string> = {
  // Return regular customers to their private customer area.
  USER: "/user",
  // Return salon employees to their operational workspace.
  STAFF: "/staff",
  // Return branch managers to their administration workspace.
  ADMIN: "/admin",
  // Return owners to their full-access workspace.
  SUPER_ADMIN: "/super-admin",
};

// Define server authorization independently from client navigation configuration.
export const PROTECTED_ROUTE_POLICIES: readonly RoutePolicy[] = [
  // Keep customer account pages exclusive to regular customer accounts.
  { pathname: "/user", roles: ["USER"] },
  // Allow operational staff pages throughout the management hierarchy.
  { pathname: "/staff", roles: ["STAFF", "ADMIN", "SUPER_ADMIN"] },
  // Allow branch administration pages to managers and owners.
  { pathname: "/admin", roles: ["ADMIN", "SUPER_ADMIN"] },
  // Keep owner-level pages exclusive to the full-access role.
  { pathname: "/super-admin", roles: ["SUPER_ADMIN"] },
];

// Resolve the explicit policy matching one exact protected route family.
export const getProtectedRoutePolicy = (pathname: string) => {
  // Match exact pages and nested paths without accepting similar route prefixes.
  return PROTECTED_ROUTE_POLICIES.find(
    (policy) =>
      pathname === policy.pathname ||
      pathname.startsWith(`${policy.pathname}/`),
  );
};
