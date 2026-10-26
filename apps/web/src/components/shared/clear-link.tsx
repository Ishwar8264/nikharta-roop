"use client";

import { useRouter } from "next/navigation";

import { ClearButton } from "./clear-button";

interface ClearLinkProps {
  href: string;
  label?: string;
  "aria-label"?: string;
}

/**
 * ClearButton that navigates instead of firing a callback.
 *
 * Why a wrapper:
 * ClearButton is callback-driven (`onClick`). Navigation is not a callback —
 * it is an anchor. Bridging them with a tiny wrapper keeps ClearButton
 * simple and avoids a `href` prop that only works half the time.
 */
export function ClearLink({
  href,
  label = "Clear filters",
  "aria-label": ariaLabel,
}: ClearLinkProps) {
  const router = useRouter();

  return (
    <ClearButton
      onClick={() => router.replace(href, { scroll: false })}
      label={label}
      variant="destructive"
      size="md"
      aria-label={ariaLabel ?? label}
      className="rounded-md"
    />
  );
}
