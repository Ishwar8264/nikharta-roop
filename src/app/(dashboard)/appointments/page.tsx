import { CalendarX2 } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { NavLink } from "@/components/shared/nav-link";
import { routes } from "@/config/routes";
import { listAppointments } from "@/features/appointment/api.server";
import { AppointmentCard } from "@/features/appointment/appointment-ui";
import type { AppointmentStatus } from "@/features/appointment/types";
import { isResourceId } from "@/server/modules/salon/salon.helpers";

const STATUSES = new Set<AppointmentStatus>(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW", "RESCHEDULED"]);

/** Lists the signed-in customer's appointments. */
export default async function AppointmentsPage({ searchParams }: { searchParams: Promise<{ cursor?: string; status?: string }> }) {
  const { cursor, status: rawStatus } = await searchParams;
  const status = rawStatus && STATUSES.has(rawStatus as AppointmentStatus) ? rawStatus as AppointmentStatus : undefined;
  const result = await listAppointments({ ...(cursor && isResourceId(cursor) ? { cursor } : {}), ...(status ? { status } : {}) });
  return <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12"><h1 className="font-heading text-3xl font-semibold">My appointments</h1><div className="mt-5 flex flex-wrap gap-2"><NavLink href={routes.appointments} variant={!status ? "default" : "outline"} size="sm" markActive={false}>All</NavLink>{(["SCHEDULED", "CONFIRMED", "COMPLETED", "CANCELLED"] as const).map((value) => <NavLink key={value} href={`${routes.appointments}?status=${value}`} variant={status === value ? "default" : "outline"} size="sm" markActive={false}>{value}</NavLink>)}</div>{result.items.length ? <div className="mt-8 space-y-4">{result.items.map((appointment) => <AppointmentCard key={appointment.id} appointment={appointment} />)}</div> : <EmptyState icon={CalendarX2} title="No appointments found" description="Your bookings will appear here after confirmation." action={<NavLink href={routes.salons} variant="default">Browse salons</NavLink>} />}{result.hasMore && result.nextCursor ? <div className="mt-8 flex justify-center"><NavLink href={`${routes.appointments}?${new URLSearchParams({ ...(status ? { status } : {}), cursor: result.nextCursor }).toString()}`} variant="outline" markActive={false}>View more</NavLink></div> : null}</main>;
}
