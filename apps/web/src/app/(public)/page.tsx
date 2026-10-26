import type { Metadata } from "next";

import { AiPromo } from "@/components/home/ai-promo";
import { FeaturedSalons } from "@/components/home/featured-salons";
import { FinalCta } from "@/components/home/final-cta";
import { Hero } from "@/components/home/hero";
import { HowItWorks } from "@/components/home/how-it-works";
import { ServiceCategories } from "@/components/home/service-categories";
import { Testimonials } from "@/components/home/testimonials";
import { TrustStats } from "@/components/home/trust-stats";
import { WhyChooseUs } from "@/components/home/why-choose-us";
import { siteConfig } from "@/config/site";
import { HomeJsonLd } from "@/lib/seo/json-ld";

/**
 * Homepage.
 *
 * Why server component:
 * Every section is a pure renderer of static config. No hooks, no state,
 * no client boundaries — the whole page renders on the server and ships as
 * HTML. The only client JS involved comes from the header's islands (user
 * menu, theme toggle, mobile nav), not from the page itself.
 *
 * Why metadata lives here and not in a layout:
 * Layout metadata is inherited but always overridden when a page defines
 * its own. Keeping the homepage's title/description local makes the SEO
 * copy discoverable from the file that owns the URL — and prevents it from
 * accidentally leaking onto sibling routes.
 *
 * Why JSON-LD is injected here:
 * Organization + WebSite schemas describe the site as a whole, not any
 * individual route. The homepage is the canonical place for them.
 */
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: `${siteConfig.name} — Premium Salon Booking Platform in India`,
  description:
    "Discover verified salons, pick your stylist, and book in under a minute. Hair, skin, nails, beard, spa, and bridal services across India.",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${siteConfig.name} — Premium Salon Booking Platform`,
    description: "Book verified salons in seconds. No calls, no waiting.",
    url: siteConfig.url,
    siteName: siteConfig.name,
    images: [
      {
        url: "/brand/logo/nikharta-roop-dark.jpg",
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — Premium Salon Booking Platform`,
    description: "Book verified salons in seconds. No calls, no waiting.",
    images: ["/brand/logo/nikharta-roop-dark.jpg"],
  },
};

export default function HomePage() {
  return (
    <>
      <HomeJsonLd />

      <Hero />
      <TrustStats />
      <ServiceCategories />
      <HowItWorks />
      <FeaturedSalons />
      <WhyChooseUs />
      <AiPromo />
      <Testimonials />
      <FinalCta />
    </>
  );
}
