import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { finalCta } from "@/config/home";
import { routes } from "@/config/routes";

/**
 * Final CTA — the last chance to convert before the footer.
 *
 * Why two CTAs of different weight:
 * The primary target is a customer ("Find a salon"). The secondary target is
 * a salon owner ("List your salon") — a completely different audience that
 * the preceding sections were not speaking to. Giving them a lower-weight
 * link lets them self-identify without diluting the main message.
 *
 * Why the gradient background:
 * The preceding sections alternate between plain and muted backgrounds.
 * Closing on a warm rose wash gives the page a visual crescendo and makes
 * the CTA read as the last beat rather than just another section.
 */
export function FinalCta() {
  return (
    <section className="px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-primary text-primary-foreground">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_28%),linear-gradient(135deg,var(--primary),color-mix(in_oklch,var(--primary)_72%,var(--secondary)))]"
        />

        <div className="relative mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/70">Your next appointment</p>
          <h2 className="mt-4 font-heading text-4xl font-semibold tracking-tight text-primary-foreground sm:text-5xl">
            {finalCta.headline}
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-primary-foreground/75">
            {finalCta.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button
              render={<Link href={routes.salons} />}
                size="lg"
            >
              {finalCta.primaryCta.label}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>

            <Button
              render={<Link href={routes.contact} />}
                variant="secondary"
              size="lg"
            >
              {finalCta.secondaryCta.label}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
