"use client";

import { Check, Eye } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";
import type { MediaAsset } from "../types";

interface MediaCardProps {
  asset: MediaAsset;
  selected: boolean;
  onToggle: () => void;
  onPreview?: () => void;
  disabled?: boolean;
}

/**
 * Single media card in the gallery grid or list.
 *
 * Why no likes/comments:
 * The backend's MediaAsset has no engagement model. Rendering fake counts
 * would be worse than rendering none — we show dimensions and format
 * instead, which the user actually needs when picking an image.
 */
export function MediaCard({
  asset,
  selected,
  onToggle,
  onPreview,
  disabled,
}: MediaCardProps) {
  const filename = asset.publicId.split("/").pop() ?? "image";
  const date = new Date(asset.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card transition-all",
        selected
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/40",
      )}
    >
      {/* Image */}
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-pressed={selected}
        aria-label={selected ? "Deselect" : "Select"}
        className="relative block aspect-square w-full overflow-hidden bg-muted"
      >
        <Image
          src={asset.url}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
          className="object-cover transition-transform group-hover:scale-105"
        />

        <span className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground backdrop-blur">
          {asset.format ?? "IMG"}
        </span>

        {selected ? (
          <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" aria-hidden="true" />
          </span>
        ) : null}
      </button>

      {/* Meta */}
      <div className="space-y-1.5 p-2.5">
        <p
          className="truncate text-xs font-medium text-foreground"
          title={filename}
        >
          {filename}
        </p>

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{date}</span>
          {onPreview ? (
            <button
              type="button"
              onClick={onPreview}
              className="flex items-center gap-0.5 transition-colors hover:text-foreground"
            >
              <Eye className="h-3 w-3" aria-hidden="true" />
              View
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
