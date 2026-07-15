// Load the strict content contract shared by every public discovery card.
import type { ExploreItem } from "@/src/components/public/home/home-content";
// Load the directional icon used by every destination action.
import { ArrowUpRight } from "lucide-react";
// Load optimized responsive images for selected visual discovery cards.
import Image from "next/image";
// Load optimized server-rendered navigation for the complete clickable card.
import Link from "next/link";

// Describe whether the card should lead with photography or compact content.
type ExploreCardProps = {
  // Render one destination from the shared schema-backed catalog.
  item: ExploreItem;
  // Keep visual and compact card layouts explicit at the section boundary.
  variant: "compact" | "visual";
};

// Render one public destination with optional optimized editorial photography.
export function ExploreCard({ item, variant }: ExploreCardProps) {
  // Resolve the destination icon once for readable JSX below.
  const Icon = item.icon;

  // Use the catalog image only when the section selected the visual treatment.
  const shouldShowImage = variant === "visual" && item.image;

  // Make the complete card a single accessible navigation target.
  return (
    <Link
      className="group flex h-full min-h-64 flex-col overflow-hidden rounded-3xl border border-border bg-card text-card-foreground shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-salon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      href={item.href}
    >
      {/* Lead selected high-value routes with a responsive local photograph. */}
      {shouldShowImage ? (
        <div className="relative aspect-[16/9] overflow-hidden border-b border-border bg-surface-soft">
          {/* Let Next.js resize and serve the project-local image efficiently. */}
          <Image
            alt={shouldShowImage.alt}
            className="object-cover transition duration-500 group-hover:scale-[1.025]"
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            src={shouldShowImage.src}
          />
          {/* Preserve icon recognition over photography with a subtle lower gradient. */}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
          {/* Keep the destination icon visible without covering the main subject. */}
          <span className="absolute bottom-4 left-4 flex size-11 items-center justify-center rounded-2xl bg-card/95 text-primary shadow-sm backdrop-blur-sm">
            <Icon aria-hidden="true" className="size-5" />
          </span>
        </div>
      ) : null}

      {/* Keep destination copy and action aligned across both card variants. */}
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        {/* Use the quieter icon treatment when photography is intentionally absent. */}
        {!shouldShowImage ? (
          <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-soft text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon aria-hidden="true" className="size-5" />
          </span>
        ) : null}

        {/* Keep the destination name visually prominent and concise. */}
        <h3 className="font-display mt-7 text-2xl font-semibold tracking-[-0.025em]">
          {item.title}
        </h3>

        {/* Explain the route value without inventing database-backed previews. */}
        <p className="mt-3 leading-7 text-muted-foreground">
          {item.description}
        </p>

        {/* Push the action to a consistent card baseline. */}
        <span className="mt-auto flex items-center gap-2 pt-7 text-sm font-bold text-primary">
          {item.linkLabel}
          <ArrowUpRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
