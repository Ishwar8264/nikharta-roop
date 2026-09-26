import { routes } from "@/config/routes";

import type { FooterGroup, NavItem } from "./nav.types";

/**
 * The public site's primary navigation.
 *
 * Why:
 * One array drives DesktopNav and MobileNav. Icons are referenced by name
 * (not imported) so this file stays free of client-only imports and can be
 * consumed by Server Components.
 */
export const publicNav: NavItem[] = [
  { label: "Home", href: routes.home, icon: "home" },
  { label: "Salons", href: routes.salons, icon: "scissors" },
  { label: "Services", href: routes.services, icon: "sparkles" },
  { label: "Blog", href: routes.blog, icon: "notebook" },
  { label: "About", href: routes.about, icon: "info" },
];

/**
 * Items shown in the avatar dropdown for a signed-in user.
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
 */
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
      { label: "Help Center", href: routes.help },
      { label: "Privacy", href: routes.privacy },
      { label: "Terms", href: routes.terms },
    ],
  },
];
