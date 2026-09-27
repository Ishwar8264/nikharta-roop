import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming settings experience. */
export default function SettingsPage() {
  return <ComingSoon {...comingSoonPages.settings} />;
}
