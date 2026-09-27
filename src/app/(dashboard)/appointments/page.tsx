import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming appointments experience. */
export default function AppointmentsPage() {
  return <ComingSoon {...comingSoonPages.appointments} />;
}
