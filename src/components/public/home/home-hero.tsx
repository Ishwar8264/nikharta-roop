// Load the shared primary and secondary action styles.
import { Button } from "@/src/components/ui/button";
// Load the server-safe hero service vocabulary.
import { CARE_AREAS } from "@/src/components/public/home/home-content";
// Load focused decorative icons for the public introduction.
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react";
// Load optimized server-rendered navigation for hero actions.
import Link from "next/link";

// Introduce the salon and give first-time visitors two clear discovery paths.
export function HomeHero() {
  // Keep marketing content and the service preview balanced across viewports.
  return (
    <section className="relative isolate overflow-hidden border-b border-border">
      {/* Add restrained brand atmosphere without loading a decorative image. */}
      <div className="pointer-events-none absolute -top-32 -right-28 -z-10 size-[28rem] rounded-full bg-brand-rose/30 blur-3xl" />
      {/* Keep hero content aligned with the global navigation width. */}
      <div className="mx-auto grid max-w-7xl gap-14 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-10 lg:py-28">
        {/* Keep the primary message focused on visitor discovery and confidence. */}
        <div className="max-w-3xl">
          {/* Introduce the positioning without unsupported awards or counts. */}
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold tracking-[0.13em] uppercase shadow-sm">
            <BadgeCheck aria-hidden="true" className="size-4 text-primary" />
            Care that begins with you
          </div>

          {/* Use one direct headline that explains what visitors can do here. */}
          <h1 className="font-display mt-7 max-w-[13ch] text-[clamp(2.8rem,7vw,5.6rem)] leading-[0.98] font-semibold tracking-[-0.05em] text-balance">
            Explore the care behind your next look.
          </h1>

          {/* Add the established bilingual brand expression as supporting identity. */}
          <p
            className="font-devanagari mt-6 text-xl leading-relaxed text-primary sm:text-2xl"
            lang="hi"
          >
            खूबसूरती, आपके अपने अंदाज़ में।
          </p>

          {/* Explain the available journey without promising unfinished booking behavior. */}
          <p className="mt-5 max-w-[60ch] text-lg leading-8 text-muted-foreground sm:text-xl">
            Discover salon services, nearby branches, trusted professionals, real
            transformations, and thoughtful beauty guidance, all in one place.
          </p>

          {/* Give service discovery priority while keeping branch search immediately available. */}
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            {/* Route the primary action to the schema-backed service catalog. */}
            <Button asChild className="min-h-12 px-6" size="lg">
              <Link href="/services">
                Explore services
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </Button>
            {/* Route the secondary action to practical salon location details. */}
            <Button
              asChild
              className="min-h-12 px-6"
              size="lg"
              variant="outline"
            >
              <Link href="/branches">
                <MapPin aria-hidden="true" className="size-4" />
                Find a branch
              </Link>
            </Button>
          </div>
        </div>

        {/* Preview the breadth of care without showing invented prices or availability. */}
        <aside className="relative mx-auto w-full max-w-lg lg:mr-0">
          {/* Add an offset panel for depth using the existing brand palette. */}
          <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2rem] bg-brand-rose/45" />
          {/* Keep the discovery panel readable in both light and dark themes. */}
          <div className="rounded-[2rem] border border-border bg-card p-6 text-card-foreground shadow-salon sm:p-8">
            {/* Clarify that the visitor can begin from a broad care need. */}
            <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
              Start with what you need
            </p>
            {/* Keep the panel message warm and action-oriented. */}
            <h2 className="font-display mt-3 text-3xl font-semibold tracking-[-0.03em]">
              Care for every version of you.
            </h2>
            {/* Explain how categories connect to personalized service discovery. */}
            <p className="mt-3 leading-7 text-muted-foreground">
              Browse by your goal, compare the details, and choose the experience
              that feels most like you.
            </p>

            {/* Render the core salon discovery areas as a responsive server-generated grid. */}
            <div className="mt-7 grid grid-cols-2 gap-3">
              {CARE_AREAS.map(({ icon: Icon, label }) => (
                // Keep each care area recognizable through one concise icon and label.
                <div
                  className="flex min-h-24 flex-col justify-between rounded-2xl border border-border bg-surface-soft p-4 text-surface-soft-foreground"
                  key={label}
                >
                  {/* Use decorative icons only because the visible label carries meaning. */}
                  <Icon aria-hidden="true" className="size-5 text-primary" />
                  {/* Keep category labels easy to scan on touch-sized cards. */}
                  <span className="mt-5 font-semibold">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
