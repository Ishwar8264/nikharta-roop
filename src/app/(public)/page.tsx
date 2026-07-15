// Load the focused placeholder used by the only current public page.
import { ComingSoon } from "@/src/components/shared/coming-soon";
// Load metadata typing for a clear browser title and description.
import type { Metadata } from "next";

// Describe the temporary public landing page in browser and search previews.
export const metadata: Metadata = {
  // Explain that the customer-facing salon experience is still being prepared.
  description: "The new Nikharta Roop salon experience is coming soon.",
  // Keep the temporary page title aligned with the established brand.
  title: "Coming Soon | Nikharta Roop Salon",
};

// Render the single public root route through one reusable placeholder component.
export default function HomePage() {
  // Keep the route focused on composition instead of presentation details.
  return <ComingSoon />;
}
