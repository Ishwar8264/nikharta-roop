import type { ComponentProps, ReactNode } from "react";

import type { NavLinkProps } from "../nav-link";

/** Render icons and badges as nodes; never pass component functions from a server. */
export interface SideNavItem extends Omit<NavLinkProps, "children" | "iconRight"> {
  id?: string;
  label: string;
  description?: string;
  badge?: ReactNode;
  iconRight?: ReactNode;
}

export interface SideNavGroup {
  id: string;
  label?: string;
  items: readonly SideNavItem[];
  className?: string;
}

export type SideNavProps = Omit<ComponentProps<"nav">, "children"> & {
  header?: ReactNode;
  footer?: ReactNode;
  /** Responsive uses a horizontal mobile list and vertical desktop list. */
  orientation?: "vertical" | "horizontal" | "responsive";
  linkDefaults?: Partial<Omit<NavLinkProps, "href" | "children">>;
  listClassName?: string;
  groupLabelClassName?: string;
} & (
  | { items: readonly SideNavItem[]; groups?: never }
  | { groups: readonly SideNavGroup[]; items?: never }
);
