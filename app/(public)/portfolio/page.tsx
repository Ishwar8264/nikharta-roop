/**
 * Purpose: Public portfolio placeholder route.
 * Responsibilities: expose metadata and reserve the gallery route for future salon work.
 * Important notes: this remains static until portfolio media is published publicly.
 */
import type { Metadata } from "next";
import { Images } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = {
  title: "Portfolio | Nikharta Roop",
  description:
    "Explore Nikharta Roop beauty transformations and salon portfolio updates soon.",
};

/**
 * Renders the public portfolio placeholder.
 */
export default function PortfolioPage() {
  return <ComingSoon icon={Images} title="Portfolio gallery is coming soon." />;
}
