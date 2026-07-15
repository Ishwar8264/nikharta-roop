// Load the reusable placeholder requested for unfinished role dashboards.
import { ComingSoon } from "@/src/components/shared/coming-soon";
// Load metadata typing for a clear owner page browser title.
import type { Metadata } from "next";

// Describe the super-admin area in browser history and tabs.
export const metadata: Metadata = {
  // Explain that owner-level system controls are being prepared.
  description: "The Nikharta Roop owner workspace is coming soon.",
  // Keep the route title aligned with full system access.
  title: "Super Admin | Nikharta Roop",
};

// Render the dedicated full-access landing page for salon owners.
export default function SuperAdminPage() {
  // Let Proxy finish server authentication and role authorization before rendering.
  return (
    <ComingSoon
      description="Organization controls, global reporting, and governance tools will appear here soon."
      eyebrow="Super Admin"
      title="Your owner workspace is coming soon."
    />
  );
}
