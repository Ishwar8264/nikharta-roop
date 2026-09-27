import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming terms of service. */
export default function TermsPage() {
  return <ComingSoon {...comingSoonPages.terms} />;
}
