import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/**
 * Shows the dashboard launch placeholder.
 */
export default function DashboardPage() {
  return <ComingSoon {...comingSoonPages.dashboard} />;
}
