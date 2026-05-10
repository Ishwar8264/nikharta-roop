import type { LucideIcon } from "lucide-react";

export type NavigationRole = "USER" | "STAFF" | "ADMIN" | "SUPER_ADMIN";

export type NavItem = {
  href: string;
  icon?: LucideIcon;
  label: string;
  roles?: NavigationRole[];
};

export type NavSection = {
  items: NavItem[];
  label: string;
};
