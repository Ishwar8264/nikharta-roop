// Keep icon identifiers serializable across Server and Client Component boundaries.
export type NavigationIcon = "portfolio";

// Describe one route rendered consistently across desktop and mobile navigation.
export type NavigationItem = {
  // Store the real App Router destination used by Next Link.
  href: string;
  // Pass one plain icon key instead of a non-serializable React component.
  icon: NavigationIcon;
  // Show one clear customer-facing label across every navigation surface.
  label: string;
};

// Keep the logo as the only home control because root is the sole public page.
export const PUBLIC_NAV_ITEMS = [] as const satisfies readonly NavigationItem[];

// Keep private navigation aligned with routes that already exist and are Proxy-protected.
export const PRIVATE_NAV_ITEMS = [
  // Open the customer's current private portfolio destination.
  { href: "/portfolio", icon: "portfolio", label: "Portfolio" },
] as const satisfies readonly NavigationItem[];
