import { MessageSquare, Star } from "lucide-react";

import { cn } from "@/lib/utils";

import type { RatingSummary } from "./types";

interface ReviewSummaryProps {
  summary: RatingSummary;
}

/**
 * Average rating + count card for a service or product.
 *
 * Why a server component:
 * The summary is the server's precomputed aggregate (avg + count). It is
 * pure text + an icon, so rendering it server-side keeps the bundle free of
 * any client cost and ships the number in the initial HTML for SEO.
 */
export function ReviewSummary({ summary }: ReviewSummaryProps) {
  const hasReviews = summary.count > 0;
  const roundedAverage = summary.average.toFixed(1);

  return (
    <section
      aria-labelledby="review-summary-title"
      className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-center gap-2">
        <Star
          aria-hidden="true"
          className={cn(
            "h-6 w-6",
            hasReviews
              ? "fill-current text-accent-foreground"
              : "text-muted-foreground",
          )}
        />
        <div>
          <p className="text-2xl font-semibold tabular-nums">
            {hasReviews ? roundedAverage : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            <span id="review-summary-title">Average rating</span>
          </p>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="hidden h-10 w-px bg-border sm:block"
      />

      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <div>
          <p className="text-2xl font-semibold tabular-nums">
            {summary.count}
          </p>
          <p className="text-xs text-muted-foreground">
            {summary.count === 1 ? "Review" : "Reviews"}
          </p>
        </div>
      </div>
    </section>
  );
}
