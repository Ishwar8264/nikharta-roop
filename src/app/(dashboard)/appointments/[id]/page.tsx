import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";
import { routes } from "@/config/routes";

/** Shows the upcoming appointment detail experience. */
export default function AppointmentDetailPage() {
  return (
    <ComingSoon
      {...comingSoonPages.appointmentDetail}
      backHref={routes.appointments}
      backLabel="Back to appointments"
    />
  );
}
