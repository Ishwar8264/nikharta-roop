import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming company story. */
export default function AboutPage() {
  return <ComingSoon {...comingSoonPages.about} />;
}
