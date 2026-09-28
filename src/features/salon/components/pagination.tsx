import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface PaginationProps {
  hasMore: boolean;
  nextCursor: string | null;
  /** Current query string, minus `cursor`. */
  baseParams: URLSearchParams;
}

/**
 * Cursor-based pagination — forward only.
 *
 * Why forward only:
 * Cursor pagination has no stable "previous" without storing history on the
 * client. Attempting to fake one by re-querying would either show duplicates
 * or skip entries when new salons are inserted between requests — the exact
 * bug cursors exist to prevent. Browser Back already covers the "go back"
 * case for the user.
 */
export function Pagination({
  hasMore,
  nextCursor,
  baseParams,
}: PaginationProps) {
  if (!hasMore || !nextCursor) return null;

  const params = new URLSearchParams(baseParams.toString());
  params.set("cursor", nextCursor);

  return (
    <div className="flex justify-center pt-12">
      <Button
        render={<Link href={`?${params.toString()}`} scroll={true} />}
        nativeButton={false}
        variant="outline"
        size="lg"
      >
        Load more salons
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}
