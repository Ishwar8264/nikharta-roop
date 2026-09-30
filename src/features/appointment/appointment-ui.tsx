import { CalendarDays, Clock } from "lucide-react";
import { NavLink } from "@/components/shared/nav-link";
import { Badge } from "@/components/ui/badge";
import { routes } from "@/config/routes";
import { appointmentPriceFormatter, formatAppointmentDateTime } from "./format";
import type { AppointmentStatus, PublicAppointment } from "./types";

const LABELS: Record<AppointmentStatus, string> = { SCHEDULED: "Scheduled", CONFIRMED: "Confirmed", IN_PROGRESS: "In progress", COMPLETED: "Completed", CANCELLED: "Cancelled", NO_SHOW: "No show", RESCHEDULED: "Rescheduled" };

/** Displays an appointment status using the shared badge. */
export function AppointmentStatusBadge({ status }: { status: AppointmentStatus }) {
  return <Badge variant={status === "CANCELLED" || status === "NO_SHOW" ? "destructive" : "secondary"}>{LABELS[status]}</Badge>;
}

/** Displays a reusable customer appointment summary. */
export function AppointmentCard({ appointment }: { appointment: PublicAppointment }) {
  const duration = appointment.services.reduce((sum, line) => sum + line.service.duration, 0);
  return <article className="rounded-xl border border-border bg-card p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-heading text-lg font-semibold">{appointment.salon.name}</h2><p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarDays className="h-4 w-4" aria-hidden="true" />{formatAppointmentDateTime(appointment.startTime, appointment.salon.timezone)}</p></div><AppointmentStatusBadge status={appointment.status} /></div><div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground"><span className="flex items-center gap-1.5"><Clock className="h-4 w-4" aria-hidden="true" />{duration} min</span><span>{appointment.services.map((line) => line.service.name).join(", ")}</span><span className="font-medium text-foreground">{appointmentPriceFormatter.format(appointment.totalPrice)}</span></div><NavLink href={routes.appointmentDetail(appointment.id)} variant="outline" size="sm" markActive={false} className="mt-5">View details</NavLink></article>;
}
