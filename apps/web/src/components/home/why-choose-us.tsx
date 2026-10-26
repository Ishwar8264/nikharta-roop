import { SectionHeading } from "@/components/shared/section-heading";
import { whyChooseUs } from "@/config/home";

/**
 * Why choose us — differentiators in a 3×2 grid.
 *
 * Why a grid and not a carousel:
 * All six points are meant to be read as a whole, together. A carousel
 * hides four of them behind an interaction that most users never make.
 *
 * Why no "learn more" links:
 * Each card is a complete claim, not a teaser. Links would just navigate
 * away from the pitch — the next section (testimonials) is where the proof
 * actually lives.
 */
export function WhyChooseUs() {
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          eyebrow="Why Nikharta Roop"
          title="Built for the way you actually book"
          description="Everything we add has to make a salon visit simpler, not busier."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {whyChooseUs.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group flex flex-col gap-5 rounded-2xl border border-border/80 bg-card p-7 transition-colors hover:border-primary/30"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>

                <div>
                  <h3 className="font-heading text-base font-semibold tracking-tight text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
