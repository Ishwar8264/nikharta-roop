/**
 * Purpose: Public blogs placeholder route.
 * Responsibilities: expose metadata and render the shared coming-soon experience for future beauty content.
 * Important notes: the page stays static until the blog module is connected.
 */
import type { Metadata } from "next";
import { BookOpenText } from "lucide-react";

import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata: Metadata = {
  title: "Beauty Blogs | Nikharta Roop",
  description:
    "Beauty tips, salon updates, and care guides from Nikharta Roop are coming soon.",
};

/**
 * Renders the public blog placeholder with the standard site shell styling.
 */
export default function BlogsPage() {
  return <ComingSoon icon={BookOpenText} title="Beauty blogs are coming soon." />;
}
