import { cva, type VariantProps } from "class-variance-authority";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const brandVariants = cva(
  "flex w-fit items-center rounded-md font-heading font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
  {
    variants: {
      size: {
        sm: "gap-2 text-base",
        md: "gap-2.5 text-lg sm:text-xl",
        lg: "gap-3 text-xl sm:text-2xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

interface BrandProps extends VariantProps<typeof brandVariants> {
  className?: string;
  href?: string;
  /** Replace this slot when a campaign needs an alternate brand mark. */
  logo?: React.ReactNode;
}

/**
 * Renders the canonical theme-aware brand link.
 *
 * Why:
 * Header, footer, auth, and navigation surfaces must share one logo treatment
 * so future asset or spacing changes cannot drift between layouts.
 */
export function Brand({
  className,
  href = "/",
  logo,
  size = "md",
}: BrandProps) {
  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} home`}
      className={cn(brandVariants({ size }), className)}
    >
      {logo ?? <BrandMark size={size ?? "md"} />}
      <span>{siteConfig.name}</span>
    </Link>
  );
}

/** Uses separate transparent assets to preserve contrast in each theme. */
function BrandMark({ size }: { size: "sm" | "md" | "lg" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block shrink-0 bg-[url('/brand/logo/nikharta-roop-mark-light-512.png')] bg-contain bg-center bg-no-repeat dark:bg-[url('/brand/logo/nikharta-roop-mark-dark-512.png')]",
        size === "sm" && "size-9",
        size === "md" && "size-11 sm:size-12",
        size === "lg" && "size-14",
      )}
    />
  );
}
