import { ArrowRight, BadgeCheck, CalendarCheck, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { hero } from "@/config/home";
import { routes } from "@/config/routes";

/**
 * Homepage hero.
 *
 * Why a split layout (copy left, image right):
 * A centered hero with a stock illustration reads as a template. A split
 * with a real salon photograph signals "this is a real product" and gives
 * the eye a resting point while the headline does its work.
 *
 * Why server component:
 * No interactivity — just two Links and an Image. The only JS the browser
 * pays for on this section is whatever Next.js ships for <Image> (near zero
 * on modern browsers thanks to responsive srcset).
 */
export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Warm background wash — subtle, uses the design system's rose hue */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-20 bg-[radial-gradient(circle_at_80%_15%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_32%),linear-gradient(135deg,color-mix(in_oklch,var(--background)_96%,var(--accent)),var(--background)_55%,color-mix(in_oklch,var(--background)_92%,var(--primary)))]"
      />
      <div aria-hidden="true" className="absolute -left-32 top-24 -z-10 h-72 w-72 rounded-full border border-primary/10" />

      <div className="mx-auto grid max-w-7xl gap-14 px-6 py-16 lg:min-h-[720px] lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20 lg:py-24">
        {/* ─── Copy column ─── */}
        <div className="max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {hero.eyebrow}
          </p>

          <h1 className="mt-6 text-balance font-heading text-5xl font-semibold leading-[1.05] tracking-[-0.04em] text-foreground sm:text-6xl lg:text-7xl">
            {hero.headline}
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
            {hero.subheadline}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              render={<Link href={routes.salons} />}
              nativeButton={false}
              size="lg"
            >
              {hero.primaryCta.label}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>

            <Button
              render={<Link href={hero.secondaryCta.href} />}
              nativeButton={false}
              variant="outline"
              size="lg"
            >
              {hero.secondaryCta.label}
            </Button>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><BadgeCheck className="h-4 w-4 text-primary" aria-hidden="true" /> Verified salons</span>
            <span className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-primary" aria-hidden="true" /> Instant booking</span>
          </div>
        </div>

        {/* ─── Image column ─── */}
        <div className="relative mx-auto w-full max-w-2xl lg:mx-0">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-muted shadow-[0_30px_80px_-30px_color-mix(in_oklch,var(--foreground)_35%,transparent)] lg:aspect-[5/6]">
            <Image
              src={hero.image.src}
              alt={hero.image.alt}
              fill
              preload
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-1000 hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-transparent" aria-hidden="true" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between rounded-2xl border border-white/20 bg-background/90 p-4 shadow-xl backdrop-blur-md sm:bottom-7 sm:left-7 sm:right-auto sm:min-w-64">
              <div>
                <p className="text-xs text-muted-foreground">Customer favourite</p>
                <p className="mt-1 font-heading font-semibold text-foreground">Premium salon care</p>
              </div>
              <div className="flex items-center gap-1 rounded-full bg-rating/15 px-2.5 py-1.5 text-sm font-semibold text-foreground">
                <Star className="h-4 w-4 fill-rating text-rating" aria-hidden="true" /> 4.8
              </div>
            </div>
          </div>
          <div className="absolute -right-5 -top-5 -z-10 h-full w-full rounded-[2rem] border border-primary/20 sm:-right-8 sm:-top-8" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
