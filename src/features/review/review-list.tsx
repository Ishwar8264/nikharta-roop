import { Star } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

import { ReviewRowActions } from "./review-row-actions";
import type { PublicReview } from "./types";

/** "12 Mar 2026" — matches the salon's `en-IN` locale conventions. */
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

interface ReviewListProps {
  items: PublicReview[];
  /**
   * The signed-in viewer's id, when available. When the viewer is the
   * author of a row, that row renders an "Edit" affordance.
   */
  currentUserId?: string | null;
  /** Which target the reviews belong to — selects the right API endpoint. */
  targetType: "service" | "product";
  /** The target's id. */
  targetId: string;
}

/**
 * Server-rendered list of reviews for a service or product.
 *
 * Why a server component:
 * The rows are pure text + an avatar + a star rating — all stable content
 * that benefits from being in the initial HTML for SEO and screen readers.
 * Only the per-row "Edit" affordance needs interactivity; that lives in the
 * `ReviewRowActions` client component so the rest of the list stays out of
 * the client bundle.
 */
export function ReviewList({
  items,
  currentUserId,
  targetType,
  targetId,
}: ReviewListProps) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center text-sm text-muted-foreground">
        No reviews yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {items.map((review) => (
        <ReviewRow
          key={review.id}
          review={review}
          canEdit={Boolean(currentUserId) && currentUserId === review.author.id}
          targetType={targetType}
          targetId={targetId}
        />
      ))}
    </ol>
  );
}

interface ReviewRowProps {
  review: PublicReview;
  canEdit: boolean;
  targetType: "service" | "product";
  targetId: string;
}

function ReviewRow({ review, canEdit, targetType, targetId }: ReviewRowProps) {
  const authorName = review.author.name?.trim() || "Anonymous";
  const initial = (review.author.name?.trim()?.[0] ?? "?").toUpperCase();
  const createdAt = dateFormatter.format(new Date(review.createdAt));

  return (
    <li className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar size="sm">
            {review.author.avatar ? (
              <AvatarImage src={review.author.avatar} alt={authorName} />
            ) : null}
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{authorName}</p>
            <time
              dateTime={review.createdAt}
              className="text-xs text-muted-foreground"
            >
              {createdAt}
            </time>
          </div>
        </div>
        <RatingStars rating={review.rating} />
      </div>

      {review.comment ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-6 text-muted-foreground">
          {review.comment}
        </p>
      ) : null}

      {canEdit ? (
        <div className="mt-3 flex justify-end border-t border-border pt-3">
          <ReviewRowActions
            targetType={targetType}
            targetId={targetId}
            review={review}
          />
        </div>
      ) : null}
    </li>
  );
}

interface RatingStarsProps {
  rating: number;
  className?: string;
}

/** Renders five stars with `rating` of them filled. */
export function RatingStars({ rating, className }: RatingStarsProps) {
  return (
    <div
      className={cn("flex items-center gap-0.5", className)}
      aria-label={`${rating} out of 5 stars`}
      role="img"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn(
            "h-4 w-4",
            star <= rating
              ? "fill-current text-accent-foreground"
              : "text-muted-foreground",
          )}
        />
      ))}
    </div>
  );
}
