import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Props Interface
// ─────────────────────────────────────────────

export interface LogoProps {
  /** Image source path */
  src?: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Predefined size */
  size?: "sm" | "md" | "lg" | "xl";
  /** Override width (takes precedence over size) */
  width?: number;
  /** Override height (takes precedence over size) */
  height?: number;
  /** Link destination */
  href?: string;
  /** Priority loading for above-the-fold (LCP) */
  priority?: boolean;
  /** Disable link — renders div instead of anchor */
  disabled?: boolean;
  /** Additional classes for the outer wrapper */
  className?: string;
  /** Responsive image sizes attribute */
  sizes?: string;
}

// ─────────────────────────────────────────────
// Size Map
// ─────────────────────────────────────────────

const sizeMap = {
  sm: { width: 80, height: 28 },
  md: { width: 120, height: 40 },
  lg: { width: 160, height: 52 },
  xl: { width: 200, height: 64 },
} as const;

// ─────────────────────────────────────────────
// Component (Server Component — no "use client")
// ─────────────────────────────────────────────

export function Logo({
  src = "/logo/icons-logo.png",
  alt = "Nikharta Logo",
  size = "md",
  width,
  height,
  href = "/",
  priority,
  disabled = false,
  className,
  sizes = "(max-width: 768px) 120px, 160px",
}: LogoProps) {
  // Resolve final dimensions
  const finalWidth = width ?? sizeMap[size].width;
  const finalHeight = height ?? sizeMap[size].height;

  // Shared Image Element — uses `fill` to avoid width/height warning
  const imageElement = (
    <div
      className="relative"
      style={{ width: finalWidth, height: finalHeight }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority ?? href === "/"}
        sizes={sizes}
        className="object-contain"
      />
    </div>
  );

  // ── Disabled State: render non-interactive wrapper ──
  if (disabled) {
    return (
      <div
        className={cn(
          "inline-flex items-center cursor-not-allowed select-none",
          className,
        )}
        aria-disabled="true"
      >
        {imageElement}
      </div>
    );
  }

  // ── Default State: render accessible Link ──
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center transition-opacity hover:opacity-80",
        className,
      )}
      aria-label={alt}
    >
      {imageElement}
    </Link>
  );
}

// Usages

/*

// Normal — clickable, links to /
<Logo />

// Disabled — no link, just image, faded
<Logo disabled />

// Disabled + custom size
<Logo disabled size="lg" />

*/
