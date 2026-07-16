// Load the established sparkle icon used by the salon wordmark.
import { Sparkles } from "lucide-react";
// Load optimized client navigation for the global home destination.
import Link from "next/link";

// Render one reusable salon brand link across public and dashboard headers.
export function NavbarBrand() {
  // Keep the compact mark visible while revealing the wordmark on wider screens.
  return (
    <Link
      aria-label="Nikharta Roop home"
      className="group flex shrink-0 items-center gap-3"
      href="/"
    >
      {/* Reuse the established salon sparkle treatment as the global brand mark. */}
      <span className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition group-hover:bg-primary-hover">
        <Sparkles aria-hidden="true" className="size-4" />
      </span>

      {/* Hide the full wordmark only where mobile width is constrained. */}
      <span className="hidden sm:block">
        {/* Keep the salon name prominent without increasing the header height. */}
        <span className="font-display block text-xl leading-none font-semibold tracking-[-0.02em]">
          Nikharta Roop
        </span>
        {/* Preserve the compact supporting brand line used by the existing navbar. */}
        <span className="mt-1 block text-[10px] font-bold tracking-[0.24em] text-muted-foreground uppercase">
          Salon &amp; Studio
        </span>
      </span>
    </Link>
  );
}
