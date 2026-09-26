/**
 * Navigation shape shared across every surface.
 *
 * Why:
 * Types live in their own file so that data (`nav.config.ts`) and rendering
 * (`nav-item.tsx`) can both depend on them without importing each other.
 * No React, no runtime code — safe for server and client alike.
 */
export interface NavItem {
  /** Visible label, already localized. */
  label: string;
  /** Destination route. */
  href: string;
  /** Optional lucide icon name; the consumer maps it to a component. */
  icon?: string;
  /** Optional short badge text (e.g. "New", "3"). */
  badge?: string;
  /** Marks links that leave the app; renders with target="_blank". */
  external?: boolean;
}

/**
 * Presentation contexts for a single nav item.
 *
 * Why:
 * The same item renders differently in a horizontal desktop bar vs. a
 * vertical mobile drawer. The variant is what allows one component to serve
 * both without branching on `window.innerWidth`.
 */
export type NavVariant = "desktop" | "mobile";

/**
 * A titled group of nav items, used by the footer.
 *
 * Why:
 * The footer presents links in labeled columns ("Explore", "Company"),
 * whereas the header is a flat ordered list. Modelling the footer shape
 * here keeps `nav.config.ts` free of type definitions.
 */
export interface FooterGroup {
  title: string;
  items: NavItem[];
}
