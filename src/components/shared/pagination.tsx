import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationProps {
  hasMore: boolean;
  nextCursor: string | null;
  /**
   * Builds the href for the next page. Caller decides how the cursor is
   * appended — this is what keeps the component agnostic to the URL shape
   * (query params vs. path segments vs. hash).
   */
  buildHref: (cursor: string) => string;
  label?: string;
  className?: string;
}

/**
 * Cursor-based "load more" control.
 *
 * Why forward-only:
 * Cursor pagination has no reliable "previous" without storing history on
 * the client. Faking one with a re-query either shows duplicates or skips
 * entries when new items arrive between requests — the exact bug cursors
 * exist to prevent. Browser Back already covers the "go back" case.
 *
 * Why buildHref, not a URL string:
 * Same component works whether the cursor lives at `?cursor=x`, `/page/x`,
 * or any other shape. Caller owns URL knowledge.
 *
 * Why no "use client":
 * Renders a Link. No state, no events — zero JS cost.
 */
export function Pagination({
  hasMore,
  nextCursor,
  buildHref,
  label = "Load more",
  className,
}: PaginationProps) {
  if (!hasMore || !nextCursor) return null;

  return (
    <div className={cn("flex justify-center pt-12", className)}>
      <Button
        render={<Link href={buildHref(nextCursor)} />}
        nativeButton={false}
        variant="outline"
        size="lg"
      >
        {label}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
