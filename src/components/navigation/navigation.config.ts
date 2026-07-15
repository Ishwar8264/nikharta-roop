// Keep icon identifiers serializable across Server and Client Component boundaries.
export type NavigationIcon = "home" | "portfolio";

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
] as const satisfies readonly NavigationItem[];

// Keep private navigation aligned with routes that already exist and are Proxy-protected.
export const PRIVATE_NAV_ITEMS = [
  // Let authenticated customers open the same public home showcase.
  { href: "/home", icon: "home", label: "Home" },
  // Open the customer's current private portfolio destination.
  { href: "/portfolio", icon: "portfolio", label: "Portfolio" },
] as const satisfies readonly NavigationItem[];
