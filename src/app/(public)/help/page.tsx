import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming help centre. */
export default function HelpPage() {
  return <ComingSoon {...comingSoonPages.help} />;
}
