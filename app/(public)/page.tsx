/**
 * Purpose: Public home placeholder route.
 * Responsibilities: expose metadata and render the temporary home experience.
 * Important notes: this route will become the customer-facing landing page later.
 */
import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = {
  title: "Nikharta Roop | Beauty Parlour Platform",
  description:
    "Nikharta Roop is preparing a beauty parlour platform for services, offers, and bookings.",
};

/**
 * Renders the temporary public home placeholder.
 */
export default function HomePage() {
  return <ComingSoon title="Nikharta Roop public home is coming soon." />;
}
