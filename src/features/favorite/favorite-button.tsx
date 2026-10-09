"use client";

import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { addFavoriteApi, removeFavoriteApi } from "./api";
import type { FavoriteTargetType } from "./types";

interface FavoriteButtonProps {
  /** Polymorphic favorite target — selects which FK column the row writes. */
  targetType: FavoriteTargetType;
  /** The target's stable id (salon.id / service.id / product.id). */
  targetId: string;
  /** True when the server already knows the caller has favorited this target. */
  initial?: boolean;
  /** The existing favorite row id, when known — needed to call DELETE. */
  initialFavoriteId?: string | null;
  /**
   * Optional name used only for the toast copy ("Salon X added to favourites"
   * vs a generic "Added to favourites"). Falls back to a generic phrase.
   */
  targetName?: string;
  /** Visual style. Defaults to "outline" so the heart reads as a secondary CTA. */
  variant?: "outline" | "ghost" | "default";
  /** Size token passed straight to Button. Defaults to "lg". */
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm" | "icon-lg" | "xs";
  /** Optional className merged onto the button. */
  className?: string;
}

/**
 * Heart toggle for a salon / service / product.
 *
 * Why optimistic state instead of a useTransition + router.refresh():
 * The heart needs to feel instant — a 200ms round-trip lag reads as "did my
 * tap register?". We flip the local state immediately, fire the API, and
 * revert + toast on failure. The next server render (e.g. on navigation)
 * re-seeds `initial` from `checkFavorite` so the optimistic state can never
 * drift permanently.
 *
 * Why the DELETE uses the favorite row id, not the target id:
 * The server's DELETE /favorites/{favoriteId} route takes the favorite row's
 * id (returned by POST /favorites or pre-seeded by checkFavorite). Stashing
 * that id in state lets a single click toggle without an extra lookup.
 */
export function FavoriteButton({
  targetType,
  targetId,
  initial = false,
  initialFavoriteId = null,
  targetName,
  variant = "outline",
  size = "lg",
  className,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initial);
  const [favoriteId, setFavoriteId] = useState<string | null>(
    initialFavoriteId,
  );
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;

    // Snapshot for rollback on failure.
    const wasFavorited = isFavorited;
    const previousFavoriteId = favoriteId;

    // Optimistic flip — see component docstring for the rationale.
    const nextFavorited = !wasFavorited;
    setIsFavorited(nextFavorited);
    setBusy(true);

    try {
      if (nextFavorited) {
        const response = await addFavoriteApi({ type: targetType, targetId });
        setFavoriteId(response.data.favorite.id);
        toast.success(
          targetName
            ? `${targetName} added to favourites.`
            : "Added to favourites.",
        );
      } else {
        if (!previousFavoriteId) {
          // No row id means the server never returned one (e.g. pre-seeded
          // `initial=true` without `initialFavoriteId`). Fall back to a
          // check+delete; the more common path is that the page passed both.
          toast.error("Could not remove favourite. Please refresh and retry.");
          setIsFavorited(true);
          return;
        }
        await removeFavoriteApi(previousFavoriteId);
        setFavoriteId(null);
        toast.success(
          targetName
            ? `${targetName} removed from favourites.`
            : "Removed from favourites.",
        );
      }
    } catch (caught) {
      // Revert the optimistic state.
      setIsFavorited(wasFavorited);
      setFavoriteId(previousFavoriteId);
      toast.error(
        caught instanceof ApiError
          ? caught.message
          : "Could not update favourite. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  const label = isFavorited ? "Saved" : "Save";

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={toggle}
      disabled={busy}
      aria-pressed={isFavorited}
      aria-label={
        isFavorited
          ? `Remove ${targetName ?? targetType} from favourites`
          : `Add ${targetName ?? targetType} to favourites`
      }
      className={cn(
        isFavorited && "border-primary/40 bg-primary/5 text-primary",
        className,
      )}
    >
      {busy ? (
        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      ) : (
        <Heart
          aria-hidden="true"
          className={cn(
            "h-4 w-4 transition-colors",
            isFavorited && "fill-current text-primary",
          )}
        />
      )}
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
