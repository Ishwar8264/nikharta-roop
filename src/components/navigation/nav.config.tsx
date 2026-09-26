import { routes } from "@/config/routes";
import type { NavItem } from "./nav.types";

/**
 * The public site's primary navigation.
 *
 * Why:
 * One array drives DesktopNav, MobileNav, and (eventually) the footer. Adding
 * a new page means adding one entry here, not editing three components.
 *
 * Order matters — this is the order users see.
 */
export const publicNav: NavItem[] = [
  { label: "Home", href: routes.home },
  { label: "Salons", href: routes.salons },
  { label: "Services", href: routes.services },
  { label: "Blog", href: routes.blog },
  { label: "About", href: routes.about },
];

/**
 * Items shown in the avatar dropdown for a signed-in user.
 *
 * Why:
 * These are not part of the public nav — a guest should not see them, and
 * the mobile drawer renders them below a separator. Keeping the list here
 * means the UserMenu component stays a pure renderer.
 */
export const userMenuNav: NavItem[] = [
  { label: "Dashboard", href: routes.dashboard, icon: "home" },
  { label: "Appointments", href: routes.appointments, icon: "calendar" },
  { label: "Favorites", href: routes.favorites, icon: "heart" },
  { label: "Loyalty", href: routes.loyalty, icon: "gift" },
  { label: "AI Assistant", href: routes.ai, icon: "sparkles" },
  { label: "Profile", href: routes.profile, icon: "user" },
  { label: "Settings", href: routes.settings, icon: "settings" },
];

/**
 * Footer navigation groups.
 *
 * Why:
 * The footer has a different shape than the header — columns of related
 * links rather than a single ordered list. Keeping the groups here means
 * the Footer component is a pure renderer and adding a "Support" column
 * later is a one-line edit.
 */
export interface FooterGroup {
  title: string;
  items: NavItem[];
}

export const footerNav: FooterGroup[] = [
  {
    title: "Explore",
    items: [
      { label: "Salons", href: routes.salons },
      { label: "Services", href: routes.services },
      { label: "AI Assistant", href: routes.ai },
      { label: "Blog", href: routes.blog },
    ],
  },
  {
    title: "Company",
    items: [
      { label: "About", href: routes.about },
      { label: "Contact", href: routes.contact },
    ],
  },
  {
    title: "Support",
    items: [
      { label: "Help Center", href: "/help" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];
