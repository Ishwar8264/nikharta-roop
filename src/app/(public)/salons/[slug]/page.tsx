import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";
import { routes } from "@/config/routes";

/** Shows the upcoming salon detail experience. */
export default function SalonDetailPage() {
  return (
    <ComingSoon
      {...comingSoonPages.salonDetail}
      backHref={routes.salons}
      backLabel="Back to salons"
    />
  );
}
