import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the main launch placeholder for Nikharta Roop. */
export default function Home() {
  return <ComingSoon {...comingSoonPages.home} backHref={null} />;
}
