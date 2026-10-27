import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  /** Optional CTA slot — caller renders a Button or ClearButton. */
  action?: React.ReactNode;
  className?: string;
}

/**
 * Generic empty state for "no results" / "nothing here yet".
 *
 * Why a dashed border:
 * A solid card reads as content. A dashed outline reads as a placeholder —
 * it says "something goes here" without pretending the space is filled.
 * That is exactly the mental model for an empty listing.
 *
 * Why no "use client":
 * Zero hooks, zero events. Renders in a server tree for free; the caller
 * owns whatever interactivity the `action` slot needs.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-20 text-center",
        className,
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-dashed border-border bg-background">
        <Icon className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
      </span>

      <h3 className="mt-5 font-heading text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h3>

      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
