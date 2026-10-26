import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming contact experience. */
export default function ContactPage() {
  return <ComingSoon {...comingSoonPages.contact} />;
}
