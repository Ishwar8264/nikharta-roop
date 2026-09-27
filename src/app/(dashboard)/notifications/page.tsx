import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming notifications experience. */
export default function NotificationsPage() {
  return <ComingSoon {...comingSoonPages.notifications} />;
}
