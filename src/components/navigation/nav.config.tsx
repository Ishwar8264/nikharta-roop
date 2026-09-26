import {
  Calendar,
  Gift,
  Heart,
  Home,
  Settings,
  Sparkles,
  User,
} from "lucide-react";

import { routes } from "@/config/routes";

import type { FooterGroup, NavItem, NavItemWithIcon } from "./nav.types";

/**
 * The public site's primary navigation.
 *
 * Why:
 * One array drives DesktopNav and MobileNav. Adding a new page means
 * adding one entry here, not editing two components.
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
 * the mobile drawer renders them below a separator. Icons are required
 * here (unlike `publicNav`) because the dropdown is a vertical list where
 * icons aid scanning.
 */
export const userMenuNav: NavItemWithIcon[] = [
  { label: "Dashboard", href: routes.dashboard, icon: Home },
  { label: "Appointments", href: routes.appointments, icon: Calendar },
  { label: "Favorites", href: routes.favorites, icon: Heart },
  { label: "Loyalty", href: routes.loyalty, icon: Gift },
  { label: "AI Assistant", href: routes.ai, icon: Sparkles },
  { label: "Profile", href: routes.profile, icon: User },
  { label: "Settings", href: routes.settings, icon: Settings },
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
