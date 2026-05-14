"use client";

import Image from "next/image";
import { Check, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MediaUploaderItem } from "@/features/media/types/media-uploader.types";

type MediaLibraryListProps = {
  items: MediaUploaderItem[];
  onSelect?: (item: MediaUploaderItem) => void;
  selectedUrl?: string | null;
};

// Square media picker used by avatar and future profile media dialogs.
export function MediaLibraryList({
  items,
  onSelect,
  selectedUrl,
}: MediaLibraryListProps) {
  if (items.length === 0) {
    return (
      <div className="grid min-h-44 place-items-center rounded-xl border bg-white p-5 text-center text-sm text-muted-foreground">
        <span>
          <ImageIcon className="mx-auto mb-2 size-6" />
          No media uploaded yet.
        </span>
      </div>
    );
  }

  return (
    <div className="grid max-h-80 grid-cols-2 gap-3 overflow-y-auto pr-1">
      {items.map((item) => {
        // URL comparison works across uploads and Cloudinary-loaded media.
        const selected = item.url === selectedUrl;

        return (
          <button
            aria-label={`Select ${item.name}`}
            aria-pressed={selected}
            className={cn(
              "group relative aspect-square overflow-hidden rounded-xl border bg-muted text-left transition",
              "hover:border-primary/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              selected
                ? "border-primary ring-2 ring-primary/25"
                : "border-border",
            )}
            key={item.id}
            onClick={() => onSelect?.(item)}
            type="button"
          >
            <Image
              alt={item.alt ?? item.name}
              className="object-cover transition duration-200 group-hover:scale-[1.02]"
              fill
              sizes="(max-width: 640px) 50vw, 320px"
              src={item.url}
              unoptimized
            />
            <span
              className={cn(
                "absolute right-2 top-2 grid size-8 place-items-center rounded-md border shadow-sm",
                selected
                  ? "border-green-600 bg-green-600 text-white"
                  : "border-white/80 bg-white/90 text-transparent",
              )}
            >
              <Check className="size-4" />
            </span>
          </button>
        );
      })}
    </div>
  );
}
