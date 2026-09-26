/**
 * Barrel export for the navigation module.
 *
 * Why:
 * Consumers import from one path (`@/components/navigation`) rather than
 * chasing individual files. Internal reshuffles stay invisible to the rest
 * of the app.
 *
 * The re-export does not need "use client" — each exported component
 * carries its own directive, and Next.js honours it at the import site.
 */
export { DesktopNav } from "./desktop-nav";
export { MobileNav } from "./mobile-nav";
export { NavItem } from "./nav-item";

export { footerNav, publicNav, userMenuNav } from "./nav.config";

export type {
  FooterGroup,
  NavItem as NavItemData,
  NavVariant,
} from "./nav.types";
