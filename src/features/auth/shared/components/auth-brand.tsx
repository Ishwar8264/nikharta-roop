import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface AuthBrandProps {
  className?: string;
  href?: string;
  /** Replace this slot with the real logo asset when it is available. */
  logo?: React.ReactNode;
}

/**
 * Renders the reusable auth brand header.
 *
 * Why:
 * Keeping the mark and name together prevents auth screens from drifting and
 * gives the future production logo one replacement point.
 */
export function AuthBrand({
  className,
  href = "/",
  logo = <BrandLogo />,
}: AuthBrandProps) {
  return (
    <Link
      href={href}
      aria-label={`${siteConfig.name} home`}
      className={cn(
        "flex w-fit items-center gap-2.5 rounded-md font-heading text-lg font-bold tracking-tight outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:text-xl",
        className,
      )}
    >
      {logo}
      <span>{siteConfig.name}</span>
    </Link>
  );
}

/** Displays the supplied logo as a compact navbar mark without altering it. */
function BrandLogo() {
  return (
    <span className="relative block size-11 shrink-0 overflow-hidden rounded-xl bg-black sm:size-12">
      <Image
        src="/brand/nikharta-roop-logo.png"
        alt=""
        fill
        priority
        sizes="48px"
        className="scale-[2] object-contain"
      />
    </span>
  );
}
