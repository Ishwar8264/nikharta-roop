import { cn } from "@/lib/utils";

import { NavLink } from "../nav-link";
import type { SideNavProps } from "./side-nav.types";

/** Server-rendered navigation shell. Only NavLink needs client routing hooks. */
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
            {group.items.map(({ id, label, description, badge, className: itemClassName, ...item }) => (
              <li key={id ?? (typeof item.href === "string" ? item.href : JSON.stringify(item.href))} className="min-w-0 shrink-0">
                <NavLink
                  variant="ghost"
                  activeClassName="bg-primary/10 text-primary"
                  reservePendingSpace
                  {...linkDefaults}
                  {...item}
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
              </li>
            ))}
          </ul>
        </div>
      ))}
      {footer}
    </nav>
  );
}
