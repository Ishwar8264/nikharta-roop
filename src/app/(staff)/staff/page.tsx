// Load the reusable placeholder requested for unfinished role dashboards.
import { ComingSoon } from "@/src/components/shared/coming-soon";
// Load metadata typing for a clear staff page browser title.
import type { Metadata } from "next";

// Describe the staff area in browser history and tabs.
export const metadata: Metadata = {
  // Explain that salon operational tools are being prepared.
  description: "The Nikharta Roop staff workspace is coming soon.",
  // Keep the route title aligned with salon employees.
  title: "Staff Area | Nikharta Roop",
};

// Render the staff workspace for employees and higher operational roles.
export default function StaffPage() {
  // Let Proxy finish server authentication and role authorization before rendering.
  return (
    <ComingSoon
      description="Appointments, schedules, and service operations will appear here soon."
      eyebrow="Staff Workspace"
      title="Your salon workspace is coming soon."
    />
  );
}
