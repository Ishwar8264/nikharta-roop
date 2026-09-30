"use client";

import { CircleX, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ClearButtonVariant = "default" | "destructive" | "ghost";
type ClearButtonSize = "sm" | "md" | "lg";

interface ClearButtonProps {
  onClick: () => void;
  /** Button label. Pass null for icon-only (aria-label still required). */
  label?: string | null;
  /** Overrides the default X icon. */
  icon?: LucideIcon;
  variant?: ClearButtonVariant;
  size?: ClearButtonSize;
  disabled?: boolean;
  className?: string;
  /** Required when `label` is null, recommended otherwise. */
  "aria-label"?: string;
}

const SIZE_STYLES: Record<
  ClearButtonSize,
  { button: "sm" | "default" | "lg"; icon: string; gap: string }
> = {
  sm: { button: "sm", icon: "h-3 w-3", gap: "gap-1" },
  md: { button: "default", icon: "h-3.5 w-3.5", gap: "gap-1.5" },
  lg: { button: "lg", icon: "h-4 w-4", gap: "gap-2" },
};

const VARIANT_STYLES: Record<ClearButtonVariant, string> = {
  // Outline + destructive tint — the default. Reads as a "dangerous
  // secondary action": red enough to signal "this clears something",
  // bordered enough to sit beside neutral controls without shouting.
  destructive:
    "border-destructive/30 text-destructive hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive",

  // Neutral outline — for filters that are not destructive.
  default:
    "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground",

  // No border, minimal weight — for tight toolbars.
  ghost:
    "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
};

/**
 * Clear/reset button with variants.
 *
 * Why a dedicated component, not just a Button + classes:
 * The same "clear filters" affordance appears on the salon listing, service
 * listing, blog tags, and any future saved-search UI. Inlining the class
 * string at each call site guarantees they will drift — one will lose the
 * icon, another will forget the destructive tint, a third will pick up the
 * wrong radius.
 *
 * Why icon-only support:
 * On mobile, the label eats horizontal space next to a search field. The
 * `label={null}` mode keeps the action reachable without crowding the row.
 * `aria-label` becomes mandatory in that mode — the caller decides the text.
 */
export function ClearButton({
  onClick,
  label = "Clear",
  icon: Icon = CircleX,
  variant = "destructive",
  size = "md",
  disabled,
  className,
  "aria-label": ariaLabel,
}: ClearButtonProps) {
  const sizeStyles = SIZE_STYLES[size];
  const iconOnly = label === null;

  return (
    <Button
      type="button"
      variant="outline"
      size={sizeStyles.button}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel ?? (iconOnly ? "Clear" : undefined)}
      className={cn(
        "shrink-0",
        !iconOnly && sizeStyles.gap,
        VARIANT_STYLES[variant],
        className,
      )}
    >
      <Icon className={sizeStyles.icon} aria-hidden="true" />
      {iconOnly ? null : label}
    </Button>
  );
}
