import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming salon directory experience. */
export default function SalonsPage() {
  return <ComingSoon {...comingSoonPages.salons} />;
}
