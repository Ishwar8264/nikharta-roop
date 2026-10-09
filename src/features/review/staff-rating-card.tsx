"use client";

import { Loader2, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  createStaffRatingApi,
  deleteStaffRatingApi,
  updateStaffRatingApi,
} from "./staff-rating-api";
import type {
  PublicStaffRating,
  RateableStaffMember,
} from "./types";

/** Backend enforces a 2000-character ceiling on comment bodies. */
const MAX_COMMENT_LENGTH = 2000;

interface StaffRatingCardProps {
  appointmentId: string;
  /** Staff members the customer can rate (the appointment's primary staff). */
  staffMembers: RateableStaffMember[];
  /** Ratings the customer has already left for this appointment. */
  existingRatings: PublicStaffRating[];
}

/**
 * "Rate your experience" card shown on a completed appointment.
 *
 * Why a Client Component:
 * Each staff row is an interactive form (star picker + comment + submit) that
 * mutates through the API. The parent appointment detail page is a Server
 * Component; this card isolates the interactivity so the rest of the page
 * stays server-rendered.
 *
 * Why `router.refresh()` after every mutation:
 * The existing ratings are loaded server-side and passed in as props. The
 * card cannot re-fetch them itself without an extra round trip —
 * `router.refresh()` re-runs the Server Component with fresh data so the row
 * flips from "create" to "edit" (or back) consistently.
 *
 * Why one form per staff member instead of a single shared form:
 * The schema's unique constraint is `(appointmentId, staffId)`, so each staff
 * member on the appointment gets their own rating. Today only the primary
 * staff is rateable through the create endpoint, but rendering per-staff keeps
 * the UI honest with the data model if that ever widens.
 */
export function StaffRatingCard({
  appointmentId,
  staffMembers,
  existingRatings,
}: StaffRatingCardProps) {
  if (staffMembers.length === 0) {
    return (
      <section className="mt-4 rounded-xl border border-border bg-card p-5">
        <h2 className="font-heading text-lg font-semibold">
          Rate your experience
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This visit didn&apos;t have a specific staff member to rate.
        </p>
      </section>
    );
  }

  // Match each existing rating to its staff member by `staffId`.
  const ratingByStaffId = new Map(
    existingRatings.map((rating) => [rating.staffId, rating]),
  );

  return (
    <section className="mt-4 rounded-xl border border-border bg-card p-5">
      <h2 className="font-heading text-lg font-semibold">
        Rate your experience
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us how your stylist did. Your feedback helps others choose the
        right professional.
      </p>

      <div className="mt-5 space-y-6">
        {staffMembers.map((staff) => (
          <StaffRatingRow
            key={staff.id}
            appointmentId={appointmentId}
            staff={staff}
            existingRating={ratingByStaffId.get(staff.id)}
          />
        ))}
      </div>
    </section>
  );
}

interface StaffRatingRowProps {
  appointmentId: string;
  staff: RateableStaffMember;
  existingRating?: PublicStaffRating;
}

function StaffRatingRow({
  appointmentId,
  staff,
  existingRating,
}: StaffRatingRowProps) {
  const router = useRouter();
  const ratingId = existingRating?.id ?? null;

  const [rating, setRating] = useState<number>(existingRating?.rating ?? 0);
  const [comment, setComment] = useState<string>(existingRating?.comment ?? "");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = MAX_COMMENT_LENGTH - comment.length;
  const isEdit = ratingId !== null;
  const canSubmit = rating >= 1 && rating <= 5 && !busy;

  async function handleSubmit() {
    if (!canSubmit) return;
    setError(null);
    setBusy(true);
    try {
      if (isEdit && ratingId) {
        await updateStaffRatingApi(ratingId, {
          rating,
          comment: comment.trim() ? comment : null,
        });
      } else {
        await createStaffRatingApi(appointmentId, {
          rating,
          comment: comment.trim() ? comment : null,
        });
      }
      toast.success("Thank you for your feedback!");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not save your rating. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!ratingId) return;
    setDeleting(true);
    setError(null);
    try {
      await deleteStaffRatingApi(ratingId);
      toast.success("Rating removed.");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Could not delete your rating. Please try again.",
      );
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4">
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          {staff.avatar ? (
            <AvatarImage src={staff.avatar} alt={staff.name ?? "Staff"} />
          ) : null}
          <AvatarFallback>
            {(staff.name?.trim()?.[0] ?? "?").toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">
            {staff.name?.trim() || "Salon professional"}
          </p>
          <p className="text-xs text-muted-foreground">
            {isEdit ? "You rated this visit" : "How was your visit?"}
          </p>
        </div>
      </div>

      {error ? <FormError className="mt-3">{error}</FormError> : null}

      <div className="mt-4 space-y-2">
        <Label id={`staff-rating-label-${staff.id}`}>Your rating</Label>
        <StarRatingInput
          ariaLabelledBy={`staff-rating-label-${staff.id}`}
          value={rating}
          disabled={busy || deleting}
          onChange={setRating}
        />
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor={`staff-comment-${staff.id}`}>Comment (optional)</Label>
        <Textarea
          id={`staff-comment-${staff.id}`}
          rows={3}
          placeholder="What did you like? Anything to improve?"
          maxLength={MAX_COMMENT_LENGTH}
          value={comment}
          disabled={busy || deleting}
          onChange={(event) => setComment(event.target.value)}
          aria-describedby={`staff-comment-count-${staff.id}`}
        />
        <div className="flex justify-end text-xs text-muted-foreground">
          <span
            id={`staff-comment-count-${staff.id}`}
            className={cn(remaining < 0 && "text-destructive")}
          >
            {remaining} characters left
          </span>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {isEdit ? (
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
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || deleting}
        >
          {busy ? (
            <>
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : isEdit ? (
            "Update rating"
          ) : (
            "Submit rating"
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
            <DialogTitle>Delete your rating?</DialogTitle>
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
              {deleting ? "Deleting…" : "Delete rating"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface StarRatingInputProps {
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
  ariaLabelledBy: string;
}

/**
 * Interactive 1–5 star rating with roving-tabindex keyboard support.
 *
 * Why radiogroup semantics:
 * Five discrete options map cleanly to a WAI-ARIA radiogroup — one tab stop,
 * arrow keys to move between stars, Enter/Space to confirm. Screen readers
 * announce "1 of 5, selected" as the user arrows through.
 *
 * Why roving tabindex (not five tabbable buttons):
 * A single tab stop keeps keyboard users from having to Tab through five
 * stars to reach the comment field. Arrow keys handle in-group movement;
 * Tab/Shift+Tab leave the group.
 */
function StarRatingInput({
  value,
  disabled,
  onChange,
  ariaLabelledBy,
}: StarRatingInputProps) {
  const stars = useMemo(() => [1, 2, 3, 4, 5], []);
  const [hover, setHover] = useState<number | null>(null);
  const refs = useRef<Array<HTMLButtonElement | null>>([]);

  // The checked star (or the first when nothing is picked) is the tab stop.
  const tabIndexFor = (star: number) =>
    star === (value || 1) ? 0 : -1;

  const focusStar = (star: number) => {
    refs.current[star - 1]?.focus();
  };

  function handleKeyDown(event: React.KeyboardEvent, star: number) {
    switch (event.key) {
      case "ArrowRight":
      case "ArrowUp": {
        event.preventDefault();
        const next = Math.min(5, star + 1);
        onChange(next);
        focusStar(next);
        break;
      }
      case "ArrowLeft":
      case "ArrowDown": {
        event.preventDefault();
        const prev = Math.max(1, star - 1);
        onChange(prev);
        focusStar(prev);
        break;
      }
      case "Home": {
        event.preventDefault();
        onChange(1);
        focusStar(1);
        break;
      }
      case "End": {
        event.preventDefault();
        onChange(5);
        focusStar(5);
        break;
      }
      case " ":
      case "Enter": {
        event.preventDefault();
        onChange(star);
        break;
      }
    }
  }

  const display = hover ?? value;

  return (
    <div
      className="flex items-center gap-1"
      role="radiogroup"
      aria-labelledby={ariaLabelledBy}
    >
      {stars.map((star) => {
        const isFilled = star <= display;
        return (
          <button
            key={star}
            ref={(el) => {
              refs.current[star - 1] = el;
            }}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            tabIndex={disabled ? -1 : tabIndexFor(star)}
            disabled={disabled}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(star)}
            onBlur={() => setHover(null)}
            onClick={() => onChange(star)}
            onKeyDown={(event) => handleKeyDown(event, star)}
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
    </div>
  );
}
