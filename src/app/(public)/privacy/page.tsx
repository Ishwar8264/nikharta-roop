import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming privacy information. */
export default function PrivacyPage() {
  return <ComingSoon {...comingSoonPages.privacy} />;
}
