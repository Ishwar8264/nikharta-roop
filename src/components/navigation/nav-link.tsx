"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import { navIconMap } from "./nav-icon-map";
import type { NavItem, NavVariant } from "./nav.types";

interface NavLinkProps {
  item: NavItem;
  variant?: NavVariant;
  /** Called after navigation; lets the mobile sheet close itself. */
  onNavigate?: () => void;
}

/**
 * The single link primitive every nav surface renders.
 *
 * Why:
 * Active-state detection only belongs in one place. DesktopNav (a server
 * component) and MobileNav (a client component) both delegate the link
 * markup here, so hover, active, and focus styles cannot drift apart.
 *
 * Icon resolution happens here, not in the caller: `item.icon` is a string
 * name (server-safe), and the actual Lucide component is looked up in the
 * client-side map. This is what keeps DesktopNav renderable on the server.
 */
export function NavLink({
  item,
  variant = "desktop",
  onNavigate,
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = isRouteActive(pathname, item.href);

  const Icon = item.icon ? navIconMap[item.icon] : null;

  const baseStyles =
    variant === "desktop"
      ? "inline-flex items-center gap-2 text-sm font-medium transition-colors"
      : "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-base font-medium transition-colors";

  const stateStyles =
    variant === "desktop"
      ? isActive
        ? "text-foreground"
        : "text-muted-foreground hover:text-foreground"
      : isActive
        ? "bg-primary/10 text-primary"
        : "text-foreground hover:bg-muted";

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(baseStyles, stateStyles)}
      aria-current={isActive ? "page" : undefined}
      {...(item.external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
    >
      {Icon ? (
        <Icon
          className={variant === "desktop" ? "h-4 w-4" : "h-4 w-4 shrink-0"}
          aria-hidden="true"
        />
      ) : null}
      <span>{item.label}</span>
      {item.badge ? (
        <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
