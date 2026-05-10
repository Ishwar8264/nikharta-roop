"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import type { NavItem } from "../navigation.types";

type NavLinkItemProps = {
  className?: string;
  item: NavItem;
  variant?: "topbar" | "sidebar" | "bottom";
};

export function NavLinkItem({
  className,
  item,
  variant = "sidebar",
}: NavLinkItemProps) {
  const pathname = usePathname();
  const isActive =
    item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex items-center text-sm font-medium transition-colors",
        variant === "topbar" &&
          "gap-2 rounded-lg px-3 py-2 text-stone-600 hover:bg-rose-50 hover:text-rose-800",
        variant === "sidebar" &&
          "w-full gap-3 rounded-lg px-3 py-2.5 text-stone-600 hover:bg-rose-50 hover:text-rose-800",
        variant === "bottom" &&
          "min-w-0 flex-col gap-1 px-1 py-2 text-xs text-stone-500 hover:text-rose-800",
        isActive &&
          variant !== "bottom" &&
          "bg-rose-100 text-rose-900 shadow-sm shadow-rose-950/5",
        isActive && variant === "bottom" && "text-rose-900",
        className,
      )}
    >
      {Icon ? <Icon className={cn("size-4", variant === "bottom" && "size-5")} /> : null}
      <span className={cn(variant === "bottom" && "truncate")}>{item.label}</span>
    </Link>
  );
}
