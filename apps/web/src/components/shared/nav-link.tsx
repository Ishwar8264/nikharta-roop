"use client";

import { Loader2 } from "lucide-react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

type NavLinkVariant = "link" | "default" | "outline" | "secondary" | "ghost";

type NavLinkSize = "sm" | "md" | "lg";

export interface NavLinkProps extends Omit<ComponentProps<typeof Link>, "children"> {
  children: ReactNode;
  /** Left icon slot. */
  icon?: ReactNode;
  /** Right icon slot. Hidden while pending (spinner takes its place). */
  iconRight?: ReactNode;
  /** Visual style. Defaults to "link". */
  variant?: NavLinkVariant;
  /** Height + text size. Ignored by the "link" variant. Defaults to "md". */
  size?: NavLinkSize;
  /** Show a spinner while navigation is pending. Defaults to true. */
  showSpinner?: boolean;
  /** Match nested routes (e.g. /salons/123 highlights /salons). Defaults to true. */
  matchNested?: boolean;
  /** Apply active-state styling + aria-current. Defaults to true. */
  markActive?: boolean;
  /** Class applied when the link is active. */
  activeClassName?: string;
  /** Extra class on the spinner icon. */
  spinnerClassName?: string;
  /** Optional visual shown instead of the default navigation spinner. */
  pendingIndicator?: ReactNode;
  pendingLabel?: string;
  /** Reserve the status slot to prevent layout shifts during navigation. */
  reservePendingSpace?: boolean;
}

const VARIANT_STYLES: Record<NavLinkVariant, string> = {
  link: "text-muted-foreground hover:text-foreground",
  default:
    "rounded-md bg-primary text-primary-foreground shadow-sm hover:bg-primary/90",
  outline:
    "rounded-md border border-border bg-background text-foreground hover:bg-muted",
  secondary:
    "rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80",
  ghost: "rounded-md text-foreground hover:bg-muted",
};

const SIZE_STYLES: Record<NavLinkSize, string> = {
  sm: "h-8 gap-1 px-2.5 text-xs",
  md: "h-10 gap-1.5 px-3.5 text-sm",
  lg: "h-11 gap-2 px-4 text-sm",
};

/**
 * Navigation link with active + pending states.
 *
 * Why the spinner is a child component:
 * useLinkStatus() reads the pending state of the nearest <Link> ancestor,
 * so it must be called inside the Link's children — never in the component
 * that renders the Link.
 *
 * Why iconRight is hidden while pending:
 * Two competing right-side affordances (arrow + spinner) read as a bug.
 * The spinner temporarily takes the icon's slot; when navigation settles
 * the icon returns.
 *
 * Why the "link" variant ignores size:
 * It is a bare text link used inline in prose and card footers. Applying a
 * height/padding token would inflate it into a button-shaped block.
 */
export function NavLink({
  href,
  children,
  icon,
  iconRight,
  variant = "link",
  size = "md",
  showSpinner = true,
  matchNested = true,
  markActive = true,
  activeClassName,
  spinnerClassName,
  pendingIndicator,
  pendingLabel = "Navigating",
  reservePendingSpace = false,
  className,
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  const target = typeof href === "string" ? href : (href.pathname ?? "");
  const isActive =
    markActive &&
    (matchNested
      ? pathname === target || pathname.startsWith(`${target}/`)
      : pathname === target);

  const isLink = variant === "link";

  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "inline-flex items-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isLink ? "gap-1.5 text-sm" : SIZE_STYLES[size],
        VARIANT_STYLES[variant],
        isActive && isLink && "font-medium text-foreground",
        isActive && activeClassName,
        className,
      )}
      {...props}
    >
      {icon ? (
        <span className="shrink-0" aria-hidden="true">
          {icon}
        </span>
      ) : null}

      <span className="min-w-0 truncate">{children}</span>

      {showSpinner ? (
        <NavLinkSpinner
          fallback={iconRight}
          className={spinnerClassName}
          indicator={pendingIndicator}
          label={pendingLabel}
          reserveSpace={reservePendingSpace}
        />
      ) : iconRight ? (
        <span className="shrink-0" aria-hidden="true">
          {iconRight}
        </span>
      ) : null}
    </Link>
  );
}

function NavLinkSpinner({
  fallback,
  className,
  indicator,
  label,
  reserveSpace,
}: {
  fallback?: ReactNode;
  className?: string;
  indicator?: ReactNode;
  label: string;
  reserveSpace: boolean;
}) {
  const { pending } = useLinkStatus();

  if (!pending && !fallback && !reserveSpace) return null;

  return (
    <span
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn("inline-flex shrink-0 items-center justify-center", reserveSpace && "ml-auto size-4")}
      data-pending={pending ? "true" : undefined}
    >
      {pending ? (
        <>
          <span aria-hidden="true">
            {indicator ?? <Loader2 className={cn("h-3.5 w-3.5 animate-spin text-muted-foreground motion-reduce:animate-none", className)} />}
          </span>
          <span className="sr-only">{label}</span>
        </>
      ) : fallback ? (
        <span aria-hidden="true">{fallback}</span>
      ) : null}
    </span>
  );
}
