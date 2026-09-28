import { SearchX } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** Whether the emptiness is caused by active filters or by an empty DB. */
  filtered: boolean;
}

/**
 * Empty state for the listing page.
 *
 * Why two variants:
 * "No salons match your filters" needs a Clear-filters action; "No salons
 * yet" needs an invitation to come back later. Using the wrong copy for the
 * wrong cause is the most common empty-state mistake — the user retries the
 * same query assuming it is a filter problem when the catalog is simply empty.
 */
export function EmptyState({ filtered }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <SearchX className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </span>

      <div className="space-y-1">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {filtered ? "No salons match your filters" : "No salons yet"}
        </h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          {filtered
            ? "Try removing a filter or searching for a different city."
            : "We are onboarding salons in your area. Check back soon."}
        </p>
      </div>

      {filtered ? (
        <Button
          render={<Link href="/salons" />}
          nativeButton={false}
          variant="outline"
        >
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
