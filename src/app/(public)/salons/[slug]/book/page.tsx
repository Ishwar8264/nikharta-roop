import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";
import { routes } from "@/config/routes";

/** Shows the upcoming salon booking experience. */
export default function SalonBookingPage() {
  return (
    <ComingSoon
      {...comingSoonPages.salonBooking}
      backHref={routes.salons}
      backLabel="Back to salons"
    />
  );
}
