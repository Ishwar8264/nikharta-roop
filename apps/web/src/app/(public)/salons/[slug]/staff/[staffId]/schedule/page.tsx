import { StaffScheduleRoute } from "@/features/staff/staff-schedule-route";

export default function SchedulePage({ params }: { params: Promise<{ slug: string; staffId: string }> }) {
  return <StaffScheduleRoute params={params} />;
}
