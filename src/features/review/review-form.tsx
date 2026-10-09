"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/features/auth/shared/components/form-error";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import {
  createOrReplaceProductReviewApi,
  createOrReplaceServiceReviewApi,
  deleteProductReviewApi,
  deleteServiceReviewApi,
  patchProductReviewApi,
  patchServiceReviewApi,
} from "./api";
import type { PublicReview } from "./types";

/**
 * Browser-safe mirror of `upsertReviewSchema`.
 *
 * Why a local copy:
 * Server modules carry the `server-only` marker. Re-importing the schema
 * would drag the server tree into the browser bundle. The rules are
 * identical: rating 1–5 (integer), comment 0–2000 chars, optional images
 * array (unused in this form — image upload is a separate concern).
 */
const reviewFormSchema = z.object({
  rating: z
    .number({ error: "Pick a rating" })
    .int("Rating must be a whole number")
    .min(1, "Pick at least 1 star")
    .max(5, "Rating cannot exceed 5"),
  comment: z
    .string()
    .trim()
    .max(2000, "Comment must contain at most 2000 characters")
    .nullable()
    .optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

/** Backend enforces a 2000-character ceiling on comment bodies. */
const MAX_COMMENT_LENGTH = 2000;

/** What the form does when it saves — depends on the parent context. */
type SaveMode =
  | { kind: "create"; targetType: "service" | "product"; targetId: string }
  | {
      kind: "edit";
      targetType: "service" | "product";
      targetId: string;
      reviewId: string;
    };

interface ReviewFormProps {
  mode: SaveMode;
  /** When in edit mode, the existing review to seed the form with. */
  initial?: Pick<PublicReview, "rating" | "comment">;
  /** Called after a successful save with the freshly-persisted review. */
  onSaved: (review: PublicReview) => void;
  /** Called when the user cancels (edit mode only). */
  onCancel?: () => void;
  /** Called when the user deletes their review (edit mode only). */
  onDeleted?: () => void;
  /** Compact layout for use inside a Dialog. */
  compact?: boolean;
}

/**
 * Star-rating + comment composer for a service or product review.
 *
 * Why one form covers both create and edit:
 * The server's POST endpoint is already an upsert (composite unique on
 * (targetId, userId)), so "create" and "edit" are the same wire shape. The
 * form only branches on which API helper to call and whether to seed
 * `initial` values.
 *
 * Why the star input uses 5 Buttons instead of a Slider:
 * Five discrete options are far easier to tap on a phone as large buttons
 * than as a slider position. Each button has an explicit aria-label so
 * screen readers announce "1 star", "2 stars", etc.
 */
export function ReviewForm({
  mode,
  initial,
  onSaved,
  onCancel,
  onDeleted,
  compact,
}: ReviewFormProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const {
    handleSubmit,
    setValue,
    watch,
    register,
    reset,
    formState: { errors },
  } = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: initial?.rating ?? 0,
      comment: initial?.comment ?? "",
    },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const rating = watch("rating");
  const comment = watch("comment") ?? "";
  const remaining = MAX_COMMENT_LENGTH - comment.length;

  async function submit(values: ReviewFormValues) {
    if (values.rating < 1 || values.rating > 5) return;
    setFormMessage(null);
    setBusy(true);
    try {
      const review =
        mode.kind === "create"
          ? await createReview(mode.targetType, mode.targetId, values)
          : await patchReview(
              mode.targetType,
              mode.targetId,
              mode.reviewId,
              values,
            );
      // Re-seed the form with the persisted values so the dirty flag clears.
      reset({ rating: review.rating, comment: review.comment ?? "" });
      toast.success(
        mode.kind === "create"
          ? "Thanks for your review!"
          : "Review updated.",
      );
      // Re-fetch the server-rendered list so the new/edited row appears
      // without forcing the user to navigate away and back.
      router.refresh();
      onSaved(review);
    } catch (caught) {
      setFormMessage(
        caught instanceof ApiError
          ? caught.message
          : "Could not save your review. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (mode.kind !== "edit") return;
    setDeleting(true);
    try {
      await deleteReview(mode.targetType, mode.targetId, mode.reviewId);
      toast.success("Review deleted.");
      // Re-fetch the server-rendered list so the deleted row disappears.
      router.refresh();
      onDeleted?.();
    } catch (caught) {
      setFormMessage(
        caught instanceof ApiError
          ? caught.message
          : "Could not delete your review. Please try again.",
      );
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  const displayRating = hoverRating ?? rating;

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className={cn("space-y-4", compact && "space-y-3")}
    >
      {formMessage ? <FormError>{formMessage}</FormError> : null}

      <div className="space-y-2">
        <Label id="review-rating-label">Your rating</Label>
        <div
          className="flex items-center gap-1"
          role="radiogroup"
          aria-labelledby="review-rating-label"
        >
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= displayRating;
            return (
              <button
                key={star}
                type="button"
                role="radio"
                aria-checked={rating === star}
                aria-label={`${star} star${star === 1 ? "" : "s"}`}
                disabled={busy}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
                onFocus={() => setHoverRating(star)}
                onBlur={() => setHoverRating(null)}
                onClick={() =>
                  setValue("rating", star, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  })
                }
                className={cn(
                  "rounded-md p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <Star
                  aria-hidden="true"
                  className={cn(
                    "h-6 w-6 transition-colors",
                    isFilled
                      ? "fill-current text-accent-foreground"
                      : "text-muted-foreground",
                  )}
                />
              </button>
            );
          })}
          {errors.rating?.message ? (
            <p role="alert" className="ml-2 text-xs text-destructive">
              {errors.rating.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-comment">Your review</Label>
        <Textarea
          id="review-comment"
          rows={compact ? 3 : 4}
          placeholder="Tell others about your experience (optional)…"
          maxLength={MAX_COMMENT_LENGTH}
          disabled={busy}
          aria-describedby="review-comment-count"
          {...register("comment")}
        />
        <div className="flex justify-end text-xs text-muted-foreground">
          <span
            id="review-comment-count"
            className={cn(remaining < 0 && "text-destructive")}
          >
            {remaining} characters left
          </span>
        </div>
        {errors.comment?.message ? (
          <p role="alert" className="text-xs text-destructive">
            {errors.comment.message}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {mode.kind === "edit" && onCancel ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={busy || deleting}
          >
            Cancel
          </Button>
        ) : null}
        {mode.kind === "edit" ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setConfirmOpen(true)}
            disabled={busy || deleting}
            className="text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        ) : null}
        <Button type="submit" disabled={busy || rating < 1}>
          {busy ? (
            <>
              <Loader2
                aria-hidden="true"
                className="h-4 w-4 animate-spin"
              />
              Saving…
            </>
          ) : mode.kind === "create" ? (
            "Post review"
          ) : (
            "Save changes"
          )}
        </Button>
      </div>

      <Dialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) setConfirmOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your review?</DialogTitle>
            <DialogDescription>
              Your rating and comment will be removed permanently. This cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deleting}
            >
              Keep it
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete review"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}

// ---------- helpers that fan out to the right target's API ----------

async function createReview(
  targetType: "service" | "product",
  targetId: string,
  values: ReviewFormValues,
): Promise<PublicReview> {
  return targetType === "service"
    ? createOrReplaceServiceReviewApi(targetId, {
        rating: values.rating,
        comment: values.comment ?? null,
      })
    : createOrReplaceProductReviewApi(targetId, {
        rating: values.rating,
        comment: values.comment ?? null,
      });
}

async function patchReview(
  targetType: "service" | "product",
  targetId: string,
  reviewId: string,
  values: ReviewFormValues,
): Promise<PublicReview> {
  return targetType === "service"
    ? patchServiceReviewApi(targetId, reviewId, {
        rating: values.rating,
        comment: values.comment ?? null,
      })
    : patchProductReviewApi(targetId, reviewId, {
        rating: values.rating,
        comment: values.comment ?? null,
      });
}

async function deleteReview(
  targetType: "service" | "product",
  targetId: string,
  reviewId: string,
): Promise<void> {
  if (targetType === "service") {
    await deleteServiceReviewApi(targetId, reviewId);
  } else {
    await deleteProductReviewApi(targetId, reviewId);
  }
}
