import { Quote, Star } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { testimonials } from "@/config/home";

/**
 * Testimonials — three real-sounding reviews.
 *
 * Why a fixed three and not a carousel:
 * A carousel hides the majority of its content behind an interaction most
 * users never perform. Three cards fit in one row on desktop and stack
 * cleanly on mobile — no scroll gesture, no hidden social proof.
 *
 * Why the quote icon sits behind the text (absolute, muted):
 * It marks the block as a quote at a glance without competing with the
 * words. A visible icon at the top would just add another element for the
 * eye to skip past.
 */
export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="Loved by customers"
        title="Real bookings, real reviews"
        description="What customers say after their salon visits."
      />

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {testimonials.map((item) => (
          <figure
            key={item.id}
            className="relative flex flex-col gap-5 rounded-2xl border border-border/80 bg-card p-7 shadow-sm"
          >
            <Quote
              className="absolute right-5 top-5 h-8 w-8 text-primary/10"
              aria-hidden="true"
            />

            {/* ─── Star row ─── */}
            <div
              className="flex items-center gap-0.5"
              aria-label={`${item.rating} out of 5 stars`}
            >
              {Array.from({ length: item.rating }).map((_, i) => (
                <Star
                  key={i}
                  className="h-4 w-4 fill-[var(--rating)] text-[var(--rating)]"
                  aria-hidden="true"
                />
              ))}
            </div>

            <blockquote className="text-sm leading-relaxed text-foreground">
              &ldquo;{item.quote}&rdquo;
            </blockquote>

            <figcaption className="mt-auto border-t border-border pt-4">
              <p className="text-sm font-semibold text-foreground">
                {item.name}
              </p>
              <p className="text-xs text-muted-foreground">{item.city}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
