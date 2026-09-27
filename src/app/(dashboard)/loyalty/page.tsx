import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming loyalty experience. */
export default function LoyaltyPage() {
  return <ComingSoon {...comingSoonPages.loyalty} />;
}
