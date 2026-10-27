"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BackButtonVariant = "link" | "default" | "outline" | "secondary" | "ghost";

type BackButtonSize = "sm" | "md" | "lg";

interface BackButtonProps {
  /** Fallback when there is no history to go back to. */
  href?: string;
  /** Label text. Defaults to "Back". */
  label?: ReactNode;
  /** Visual style. Defaults to "link". */
  variant?: BackButtonVariant;
  /** Height + text size. Defaults to "md". */
  size?: BackButtonSize;
  className?: string;
  /** Icon size classes. Defaults to `h-4 w-4`. */
  iconClassName?: string;
}

const VARIANT_STYLES: Record<BackButtonVariant, string> = {
  /** Bare text — used inline in article headers. */
  link: "text-muted-foreground hover:text-foreground",
  /** Solid primary button. */
  default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
  /** Bordered, transparent background. */
  outline: "border border-border bg-background text-foreground hover:bg-muted",
  /** Muted filled, no border. */
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
  /** Transparent — for toolbars where the icon alone should read. */
  ghost: "text-foreground hover:bg-muted",
};

const SIZE_STYLES: Record<BackButtonSize, string> = {
  sm: "h-8 gap-1 px-2.5 text-xs",
  md: "h-10 gap-1.5 px-3.5 text-sm",
  lg: "h-11 gap-2 px-4 text-sm",
};

/**
 * Back navigation with a safe fallback.
 *
 * Why client:
 * router.back() reads the browser history stack — a client-only API.
 *
 * Why the fallback href matters:
 * Users arriving from a search engine or a shared link have no history to
 * pop. Without a fallback they would be stranded on the page they just
 * landed on. The link keeps the exit route deterministic.
 *
 * Why `link` skips size/padding:
 * The bare variant is an inline text link. Applying the shared height token
 * would inflate it into a button-shaped block and break the flow of prose
 * it sits in.
 */
export function BackButton({
  href = "/salons",
  label = "Back",
  variant = "link",
  size = "md",
  className,
  iconClassName,
}: BackButtonProps) {
  const router = useRouter();
  const isLink = variant === "link";

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Preserve cmd/ctrl-click, middle-click, and target="_blank" behaviour.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

    if (window.history.length > 1) {
      e.preventDefault();
      router.back();
    }
  }

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "inline-flex items-center transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isLink
          ? "gap-1.5 text-sm"
          : cn("rounded-md font-medium", SIZE_STYLES[size]),
        VARIANT_STYLES[variant],
        className,
      )}
    >
      <ArrowLeft className={cn("h-4 w-4", iconClassName)} aria-hidden="true" />
      {label}
    </Link>
  );
}
