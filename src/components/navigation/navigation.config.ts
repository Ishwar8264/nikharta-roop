// Load the shared schema-derived role union used by server authorization.
import type { UserRole } from "@/src/constants/authorization";

// Keep icon identifiers serializable across Server and Client Component boundaries.
export type NavigationIcon =
  | "admin"
  | "analytics"
  | "blogs"
  | "bookings"
  | "branches"
  | "favorites"
  | "home"
  | "notifications"
  | "offers"
  | "payments"
  | "portfolio"
  | "profile"
  | "refunds"
  | "reviews"
  | "schedule"
  | "services"
  | "staff"
  | "super-admin"
  | "team"
  | "users"
  | "user";

// Describe one route rendered consistently across desktop and mobile navigation.
export type NavigationItem = {
  // Store the real App Router destination used by Next Link.
  href: string;
  // Pass one plain icon key instead of a non-serializable React component.
  icon: NavigationIcon;
  // Show one clear customer-facing label across every navigation surface.
  label: string;
};

// Keep public navigation aligned with the restored design-system showcase route.
export const PUBLIC_NAV_ITEMS = [
  // Open the restored public home showcase without replacing the root placeholder.
  { href: "/home", icon: "home", label: "Home" },
  // Browse active salon branches backed by the Branch model.
  { href: "/branches", icon: "branches", label: "Branches" },
  // Browse bookable salon services and their categories.
  { href: "/services", icon: "services", label: "Services" },
  // Discover active discounts and branch-specific promotions.
  { href: "/offers", icon: "offers", label: "Offers" },
  // View public before-and-after work from salon portfolio items.
  { href: "/portfolio", icon: "portfolio", label: "Portfolio" },
  // Browse public staff profiles without exposing the staff workspace.
  { href: "/team", icon: "team", label: "Team" },
  // Read published salon education and marketing articles.
  { href: "/blogs", icon: "blogs", label: "Blogs" },
  // Read approved customer reviews and verified feedback.
  { href: "/reviews", icon: "reviews", label: "Reviews" },
] as const satisfies readonly NavigationItem[];

// Keep private navigation aligned with routes that already exist and are Proxy-protected.
export const PRIVATE_NAV_ITEMS = [
  // Let authenticated customers open the same public home showcase.
  { href: "/home", icon: "home", label: "Home" },
  // Open the dedicated landing page for regular customer accounts.
  { href: "/user", icon: "user", label: "Customer Area" },
  // Manage the customer's current and historical bookings.
  { href: "/user/bookings", icon: "bookings", label: "Bookings" },
  // Reuse UserFavoriteService as the customer's saved-services destination.
  { href: "/user/favorites", icon: "favorites", label: "Favorites" },
  // Review payments linked to the customer's bookings.
  { href: "/user/payments", icon: "payments", label: "Payments" },
  // Manage feedback created from completed bookings.
  { href: "/user/reviews", icon: "reviews", label: "My Reviews" },
  // View customer communication linked to bookings and account activity.
  {
    href: "/user/notifications",
    icon: "notifications",
    label: "Notifications",
  },
  // Complete the profile fields already available on the User model.
  { href: "/user/profile", icon: "profile", label: "Profile" },
] as const satisfies readonly NavigationItem[];

// Keep staff navigation focused on shared operations and the public showcase.
export const STAFF_NAV_ITEMS = [
  // Let authenticated employees open the public home showcase.
  { href: "/home", icon: "home", label: "Home" },
  // Open the operational workspace shared with higher roles.
  { href: "/staff", icon: "staff", label: "Staff Area" },
  // Manage appointments assigned through the Staff and Booking models.
  { href: "/staff/bookings", icon: "bookings", label: "Bookings" },
  // Coordinate assigned availability and StaffLeave records.
  { href: "/staff/schedule", icon: "schedule", label: "Schedule" },
  // Review services available through StaffSkill relations.
  { href: "/staff/services", icon: "services", label: "Skills & Services" },
  // Maintain work samples connected to the signed-in Staff profile.
  { href: "/staff/portfolio", icon: "portfolio", label: "My Portfolio" },
  // Read verified feedback linked to the signed-in staff profile.
  { href: "/staff/reviews", icon: "reviews", label: "Reviews" },
  // Maintain the employee's linked User and Staff profile details.
  { href: "/staff/profile", icon: "profile", label: "Profile" },
] as const satisfies readonly NavigationItem[];

// Keep admin navigation focused on staff operations and branch management.
export const ADMIN_NAV_ITEMS = [
  // Reuse every staff operation because managers retain operational access.
  ...STAFF_NAV_ITEMS,
  // Open the branch administration workspace.
  { href: "/admin", icon: "admin", label: "Admin Area" },
  // Manage physical salon locations and holiday schedules.
  { href: "/admin/branches", icon: "branches", label: "Branches" },
  // Manage categories, prices, durations, and active services.
  { href: "/admin/services", icon: "services", label: "Services" },
  // Manage employee profiles, skills, commissions, and leave.
  { href: "/admin/staff", icon: "staff", label: "Staff" },
  // Review branch customers without exposing owner-level role administration.
  { href: "/admin/customers", icon: "users", label: "Customers" },
  // Manage booking assignment, status, and salon scheduling.
  { href: "/admin/bookings", icon: "bookings", label: "Bookings" },
  // Review booking payment transactions and settlement states.
  { href: "/admin/payments", icon: "payments", label: "Payments" },
  // Process refund records linked to payments and bookings.
  { href: "/admin/refunds", icon: "refunds", label: "Refunds" },
  // Manage discounts across services and branch locations.
  { href: "/admin/offers", icon: "offers", label: "Offers" },
  // Manage before-and-after portfolio items and images.
  { href: "/admin/portfolio", icon: "portfolio", label: "Portfolio" },
  // Moderate customer reviews and publish admin replies.
  { href: "/admin/reviews", icon: "reviews", label: "Reviews" },
  // Manage blog categories, drafts, publishing, and SEO content.
  { href: "/admin/blogs", icon: "blogs", label: "Blogs" },
  // Monitor outbound booking and customer communication status.
  {
    href: "/admin/notifications",
    icon: "notifications",
    label: "Notifications",
  },
] as const satisfies readonly NavigationItem[];

// Give owners access to every operational and administrative landing page.
export const SUPER_ADMIN_NAV_ITEMS = [
  // Reuse every operational and branch administration destination for owners.
  ...ADMIN_NAV_ITEMS,
  // Open the dedicated owner-level workspace.
  {
    href: "/super-admin",
    icon: "super-admin",
    label: "Super Admin",
  },
  // Manage every customer, employee, manager, and owner account.
  { href: "/super-admin/users", icon: "users", label: "Users" },
  // Review onboarding, bookings, payments, and business-wide trends.
  {
    href: "/super-admin/analytics",
    icon: "analytics",
    label: "Analytics",
  },
] as const satisfies readonly NavigationItem[];

// Select the correct authenticated navigation without storing derived UI state.
export const getNavigationItemsForRole = (
  role: UserRole,
): readonly NavigationItem[] => {
  // Give regular customers only their private customer destinations.
  if (role === "USER") {
    return PRIVATE_NAV_ITEMS;
  }

  // Give salon employees their focused operational navigation.
  if (role === "STAFF") {
    return STAFF_NAV_ITEMS;
  }

  // Give branch managers staff and administration destinations.
  if (role === "ADMIN") {
    return ADMIN_NAV_ITEMS;
  }

  // Give owners every role-level destination only through an explicit role match.
  if (role === "SUPER_ADMIN") {
    return SUPER_ADMIN_NAV_ITEMS;
  }

  // Make TypeScript reject future schema roles until navigation is reviewed safely.
  return assertUnreachableRole(role);
};

// Fail closed at runtime while preserving compile-time exhaustiveness for future roles.
const assertUnreachableRole = (role: never): never => {
  // Reject unsupported roles instead of accidentally granting owner navigation.
  throw new Error(`Navigation is not configured for role: ${String(role)}`);
};
