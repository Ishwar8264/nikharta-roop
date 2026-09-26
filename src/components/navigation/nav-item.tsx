"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

import type { NavItem as NavItemType, NavVariant } from "./nav.types";

interface NavItemProps {
  item: NavItemType;
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
 * "use client" is required because `usePathname` is a client-only hook.
 * Server components can still import this file — Next.js treats the import
 * as a client boundary and ships only this small chunk to the browser.
 */
export function NavItem({
  item,
  variant = "desktop",
  onNavigate,
}: NavItemProps) {
  const pathname = usePathname();
  const isActive = isRouteActive(pathname, item.href);

  const baseStyles =
    variant === "desktop"
      ? "text-sm font-medium transition-colors"
      : "flex w-full items-center rounded-lg px-3 py-2 text-base font-medium transition-colors";

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
      {item.label}
      {item.badge ? (
        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {item.badge}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Determines whether a path matches the nav item's href.
 *
 * Why:
 * `pathname === href` breaks for parent links: /salons should stay active on
 * /salons/glamour-studio. But a naive `startsWith` also matches sibling
 * routes like /salons-other, so we anchor the prefix with a trailing slash.
 *
 * The root path "/" is special-cased because every path starts with "/".
 */
function isRouteActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
