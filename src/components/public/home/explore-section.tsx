// Load the schema-backed discovery catalog rendered by this section.
import { EXPLORE_ITEMS } from "@/src/components/public/home/home-content";
// Load the focused card that owns visual and compact destination treatments.
import { ExploreCard } from "@/src/components/public/home/explore-card";
// Load the shared public section heading treatment.
import { SectionHeading } from "@/src/components/public/home/section-heading";

// Show every meaningful public product area without overwhelming the hero.
export function ExploreSection() {
  // Feature only destinations whose understanding improves through photography.
  const visualItems = EXPLORE_ITEMS.filter((item) => item.image);

  // Keep supporting destinations compact to avoid a repetitive stock-photo wall.
  const compactItems = EXPLORE_ITEMS.filter((item) => !item.image);

  // Keep the complete schema-backed discovery catalog in one scannable section.
  return (
    <section className="border-b border-border bg-background py-16 sm:py-20 lg:py-24">
      {/* Align discovery content with the global public layout width. */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        {/* Introduce the routes as visitor choices rather than technical features. */}
        <SectionHeading
          description="Start with a service, a location, an idea, or the people behind the experience. Each path helps you make a more confident salon decision."
          eyebrow="Explore Nikharta Roop"
          title="Everything you need to plan your visit."
        />

        {/* Give the four strongest discovery paths generous visual storytelling space. */}
        <div className="mt-10 grid gap-5 lg:mt-14 lg:grid-cols-2">
          {visualItems.map((item) => (
            // Use stable route paths as keys across server renders.
            <ExploreCard item={item} key={item.href} variant="visual" />
          ))}
        </div>

        {/* Keep remaining public destinations compact beneath the visual collection. */}
        <div className="mt-5 grid gap-5 md:grid-cols-3">
          {compactItems.map((item) => (
            // Reuse the exact navigation card semantics without unnecessary imagery.
            <ExploreCard item={item} key={item.href} variant="compact" />
          ))}
        </div>
      </div>
    </section>
  );
}
