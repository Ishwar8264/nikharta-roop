/**
 * The set of icon names the navigation can use.
 *
 * Why a closed union instead of a loose string:
 * A typo like `"hous"` becomes a compile error, not a silent missing icon
 * at runtime. The union is the single source of truth — the client-side
 * icon map is checked against it.
 */
export type NavIconName =
  | "home"
  | "scissors"
  | "sparkles"
  | "notebook"
  | "info"
  | "calendar"
  | "heart"
  | "gift"
  | "user"
  | "settings";

/**
 * Navigation shape shared across every surface.
 *
 * Why icon is a string name, not a component:
 * Nav data is read by Server Components (DesktopNav, Footer) and passed to
 * Client Components (NavLink). React components are functions and cannot
 * cross the server→client boundary. Passing a serializable name and
 * resolving it to a component inside the client keeps the boundary intact
 * while preserving the SSR win.
 */
export interface NavItem {
  label: string;
  href: string;
  /** Optional leading icon, referenced by name. */
  icon?: NavIconName;
  badge?: string;
  external?: boolean;
}

export type NavVariant = "desktop" | "mobile";

export interface FooterGroup {
  title: string;
  items: NavItem[];
}
