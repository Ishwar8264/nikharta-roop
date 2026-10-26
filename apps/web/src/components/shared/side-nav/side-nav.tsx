"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

import { NavLink } from "../nav-link";
import type { SideNavProps } from "./side-nav.types";

/** Shared navigation with contextual links for the current section. */
export function SideNav({
  items,
  groups,
  header,
  footer,
  orientation = "responsive",
  linkDefaults,
  listClassName,
  groupLabelClassName,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: SideNavProps) {
  const pathname = usePathname();
  const sections = groups ?? [{ id: "links", items: items ?? [] }];

  return (
    <nav
      {...props}
      aria-label={ariaLabel ?? (ariaLabelledBy ? undefined : "Side navigation")}
      aria-labelledby={ariaLabelledBy}
      className={cn("space-y-4", className)}
    >
      {header}
      {sections.map((group) => (
        <div key={group.id} className={cn("space-y-2", group.className)}>
          {group.label ? (
            <p className={cn("px-3 text-xs font-medium text-muted-foreground", groupLabelClassName)}>
              {group.label}
            </p>
          ) : null}
          <ul className={cn(
            "flex gap-1",
            orientation === "vertical" && "flex-col",
            orientation === "horizontal" && "overflow-x-auto",
            orientation === "responsive" && "overflow-x-auto md:flex-col md:overflow-visible",
            listClassName,
          )}>
            {group.items.map(({ id, label, description, badge, subItems, className: itemClassName, ...item }) => {
              const target = typeof item.href === "string" ? item.href : item.href.pathname;
              const hasSubItems = Boolean(subItems?.length);
              const expanded = hasSubItems && (
                Boolean(target && (pathname === target || pathname.startsWith(`${target}/`))) ||
                Boolean(subItems?.some((child) => {
                  const childTarget = typeof child.href === "string" ? child.href : child.href.pathname;
                  return childTarget && (pathname === childTarget || (child.matchNested !== false && pathname.startsWith(`${childTarget}/`)));
                }))
              );
              return (
              <li key={id ?? (typeof item.href === "string" ? item.href : JSON.stringify(item.href))} className="min-w-0 shrink-0">
                <NavLink
                  variant="ghost"
                  activeClassName="bg-primary/10 text-primary"
                  reservePendingSpace
                  {...linkDefaults}
                  {...item}
                  aria-expanded={hasSubItems ? expanded : undefined}
                  iconRight={hasSubItems ? expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" /> : item.iconRight}
                  className={cn("w-full justify-start", description && "h-auto min-h-10 py-2", linkDefaults?.className, itemClassName)}
                >
                  <span className="block">
                  {label}
                  {badge != null ? (
                    <span className="ml-2 inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">{badge}</span>
                  ) : null}
                  </span>
                  {description ? (
                    <span className="mt-0.5 block whitespace-normal text-xs font-normal leading-relaxed text-muted-foreground">
                      {description}
                    </span>
                  ) : null}
                </NavLink>
                {expanded ? (
                  <ul className="ml-5 mt-2 space-y-1 border-l border-border pl-3">
                    {subItems?.map(({ id: childId, label: childLabel, ...child }) => {
                      return (
                        <li key={childId ?? String(child.href)}>
                          <NavLink variant="ghost" size="sm" activeClassName="bg-primary/10 text-primary" reservePendingSpace {...linkDefaults} {...child} className={cn("w-full justify-start", child.className)}>
                            {childLabel}
                          </NavLink>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </li>
              );
            })}
          </ul>
        </div>
      ))}
      {footer}
    </nav>
  );
}
