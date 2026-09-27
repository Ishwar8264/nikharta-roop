import { Star } from "lucide-react";

import { trustStats } from "@/config/home";

/**
 * Trust stats row — sits directly under the hero.
 *
 * Why directly after the hero:
 * The hero makes the claim ("premium salons"). The very next thing a new
 * visitor needs is evidence. Numerals in a horizontal row are the cheapest,
 * fastest-to-read form of that evidence.
 *
 * Why no cards, no borders:
 * Numbers stand on their own. Boxing them dilutes their weight and adds
 * visual noise without information.
 */
export function TrustStats() {
  return (
    <section
      aria-label="Platform stats"
      className="border-y border-border/70 bg-background"
    >
      <div className="mx-auto grid max-w-7xl grid-cols-2 px-6 py-8 sm:grid-cols-4 sm:py-10">
        {trustStats.map((stat, index) => (
          <div key={stat.label} className={`py-3 text-center ${index % 2 === 1 ? "border-l border-border" : ""} ${index > 0 ? "sm:border-l sm:border-border" : ""}`}>
            <div className="flex items-center justify-center gap-1.5">
              <span className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {stat.value}
              </span>
              {"showStar" in stat && stat.showStar ? (
                <Star
                  className="h-5 w-5 fill-[var(--rating)] text-[var(--rating)]"
                  aria-hidden="true"
                />
              ) : null}
            </div>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
