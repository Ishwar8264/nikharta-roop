import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { SectionHeading } from "@/components/shared/section-heading";
import { Button } from "@/components/ui/button";
import { featuredSalons } from "@/config/home";
import { routes } from "@/config/routes";
import { SalonCard } from "./salon-card";

/**
 * Featured salons — real-ish listings to prove the platform has inventory.
 *
 * Why static right now:
 * The homepage renders even when the DB is empty or the app is running on a
 * fresh clone. Once the salon directory ships, this block swaps to a Prisma
 * query in the page — the section component itself won't change.
 *
 * Why 6 and not 3:
 * Three reads as a demo. Six fills two rows on desktop and signals "there
 * are more where these came from" without needing a "view all" strip.
 */
export function FeaturedSalons() {
  return (
    <section className="bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-24">
        <SectionHeading
          eyebrow="Featured"
          title="Spaces you’ll love returning to"
          description="Top-rated partners across our live cities — verified for quality and hygiene."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featuredSalons.map((salon) => (
            <SalonCard key={salon.id} salon={salon} />
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <Button
            render={<Link href={routes.salons} />}
            variant="outline"
            size="lg"
          >
            Browse all salons
            <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
