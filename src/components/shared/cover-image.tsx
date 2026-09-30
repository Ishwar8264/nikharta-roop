import { ImageOff } from "lucide-react";
import Image from "next/image";

import { cn } from "@/lib/utils";

type CoverAspect = "video" | "wide" | "square" | "banner";
type CoverRounded = "none" | "md" | "lg" | "xl" | "2xl";

const ASPECT_STYLES: Record<CoverAspect, string> = {
  /** 16:9 — detail pages, cards */
  video: "aspect-video",
  /** 21:9 — hero banners, slim headers */
  wide: "aspect-[21/9]",
  /** 1:1 — thumbnails, avatars */
  square: "aspect-square",
  /** 3:1 — very slim strip */
  banner: "aspect-[3/1]",
};

const ROUNDED_STYLES: Record<CoverRounded, string> = {
  none: "rounded-none",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

interface CoverImageProps {
  src?: string | null;
  alt: string;
  /** Aspect ratio preset. Defaults to "video" (16:9). */
  aspect?: CoverAspect;
  /** Corner radius preset. Defaults to "2xl". */
  rounded?: CoverRounded;
  /** Load eagerly when this is the LCP element (detail page hero). */
  priority?: boolean;
  /** Responsive `sizes` attribute. Defaults assume full-width hero. */
  sizes?: string;
  /** Message shown when `src` is missing or fails. */
  emptyLabel?: string;
  /** Tailwind classes merged onto the wrapper. */
  className?: string;
  /** Tailwind classes merged onto the <Image> itself. */
  imageClassName?: string;
}

/**
 * Shared cover/banner image.
 *
 * Why a server component:
 * No hooks, no browser APIs, no state. Rendering on the server keeps the
 * client bundle lean — the detail page streams HTML with the image already
 * resolved.
 *
 * Why aspect presets instead of a raw height:
 * Aspect ratios keep the frame responsive without media queries. A fixed
 * height (e.g. `h-80`) looks wrong on a phone and forces you to add
 * breakpoints for every layout that reuses this component.
 */
export function CoverImage({
  src,
  alt,
  aspect = "video",
  rounded = "2xl",
  priority,
  sizes = "(max-width: 1200px) 100vw, 1200px",
  emptyLabel = "No image",
  className,
  imageClassName,
}: CoverImageProps) {
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-muted",
        ASPECT_STYLES[aspect],
        ROUNDED_STYLES[rounded],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className={cn("object-cover", imageClassName)}
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageOff className="h-5 w-5" aria-hidden="true" />
          <span className="text-xs">{emptyLabel}</span>
        </div>
      )}
    </div>
  );
}
