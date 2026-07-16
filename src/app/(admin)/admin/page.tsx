// Load the reusable placeholder requested for unfinished role dashboards.
import { ComingSoon } from "@/src/components/shared/coming-soon";
// Load metadata typing for a clear admin page browser title.
import type { Metadata } from "next";

// Describe the admin area in browser history and tabs.
export const metadata: Metadata = {
  // Explain that branch administration tools are being prepared.
  description: "The Nikharta Roop administration area is coming soon.",
  // Keep the route title aligned with branch managers.
  title: "Admin Area | Nikharta Roop",
};

// Render the administration workspace for managers and owners.
export default function AdminPage() {
  // Let Proxy finish server authentication and role authorization before rendering.
  return (
    <ComingSoon
      description="Branch management, reporting, and team controls will appear here soon."
      eyebrow="Admin Area"
      title="Your administration workspace is coming soon."
    />
  );
}
