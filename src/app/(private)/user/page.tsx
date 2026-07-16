// Load the reusable placeholder requested for unfinished role dashboards.
import { ComingSoon } from "@/src/components/shared/coming-soon";
// Load metadata typing for a clear private page browser title.
import type { Metadata } from "next";

// Describe the customer area in browser history and tabs.
export const metadata: Metadata = {
  // Explain that the private customer dashboard is being prepared.
  description: "The Nikharta Roop customer area is coming soon.",
  // Keep the route title aligned with the customer role.
  title: "Customer Area | Nikharta Roop",
};

// Render the dedicated landing page for regular customer accounts.
export default function UserPage() {
  // Let Proxy finish server authentication and role authorization before rendering.
  return (
    <ComingSoon
      description="Your bookings, preferences, and salon journey will appear here soon."
      eyebrow="Customer Area"
      title="Your personal salon space is coming soon."
    />
  );
}
