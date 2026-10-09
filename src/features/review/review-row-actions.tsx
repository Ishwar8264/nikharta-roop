"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

import { ReviewForm } from "./review-form";
import type { PublicReview } from "./types";

interface ReviewRowActionsProps {
  /** Which target the review belongs to — selects the right API endpoint. */
  targetType: "service" | "product";
  /** The target's id. */
  targetId: string;
  /** The existing review row, used to seed the edit form. */
  review: PublicReview;
}

/**
 * Per-row actions for a review authored by the current user.
 *
 * Why a separate client file instead of inlining into the server list:
 * The list itself is server-rendered (the review rows are pure text + stars
 * and benefit from being in the initial HTML for SEO). Only the edit/delete
 * affordance needs interactivity, so this client component isolates that
 * without dragging the entire list into the client bundle.
 *
 * Why `router.refresh()` after every mutation:
 * The list is server-rendered. The form mutates through the API but cannot
 * re-render the list rows itself — `router.refresh()` re-fetches the
 * server data and replaces the row content with the new state, keeping a
 * single source of truth on the server.
 */
export function ReviewRowActions({
  targetType,
  targetId,
  review,
}: ReviewRowActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setEditOpen(true)}
        className="text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        Edit
      </Button>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit your review</DialogTitle>
            <DialogDescription>
              Update your rating or comment. Your previous review will be
              replaced.
            </DialogDescription>
          </DialogHeader>
          <ReviewForm
            mode={{
              kind: "edit",
              targetType,
              targetId,
              reviewId: review.id,
            }}
            initial={{ rating: review.rating, comment: review.comment }}
            compact
            onSaved={() => {
              setEditOpen(false);
              router.refresh();
            }}
            onDeleted={() => {
              setEditOpen(false);
              router.refresh();
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
