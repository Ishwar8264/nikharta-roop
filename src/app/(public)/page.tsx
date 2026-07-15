// Load focused server components that compose the public discovery experience.
import { ExploreSection } from "@/src/components/public/home/explore-section";
import { HomeCallToAction } from "@/src/components/public/home/home-cta";
import { HomeFooter } from "@/src/components/public/home/home-footer";
import { HomeHero } from "@/src/components/public/home/home-hero";
import { JourneySection } from "@/src/components/public/home/journey-section";
// Load metadata typing for a clear browser title and description.
import type { Metadata } from "next";

// Describe the complete public landing page in browser and search previews.
export const metadata: Metadata = {
  // Summarize the visitor journey using the page's real public destinations.
  description:
    "Explore Nikharta Roop salon services, branches, offers, professionals, portfolio, reviews, and beauty guidance.",
  // Keep the root title focused on salon discovery and the established brand.
  title: "Explore Salon Services | Nikharta Roop",
};

// Compose the public root entirely from synchronous Server Components.
export default function HomePage() {
  // Keep the route focused on composition while sections own presentation details.
  return (
    <>
      {/* Group the unique page content under one semantic main landmark. */}
      <main>
        {/* Introduce the visitor journey and its two primary discovery actions. */}
        <HomeHero />
        {/* Surface every schema-backed public destination in one scannable catalog. */}
        <ExploreSection />
        {/* Explain how discovery leads into a manageable customer journey. */}
        <JourneySection />
        {/* Close with honest next steps while booking pages are developed separately. */}
        <HomeCallToAction />
      </main>
      {/* Reuse public navigation at the natural end of the landing page. */}
      <HomeFooter />
    </>
  );
}
