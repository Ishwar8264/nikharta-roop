import { notFound } from "next/navigation";
import { BackButton } from "@/components/shared/back-button";
import { routes } from "@/config/routes";
import { getAppointment } from "@/features/appointment/api.server";
import { AppointmentStatusBadge } from "@/features/appointment/appointment-ui";
import { appointmentPriceFormatter, formatAppointmentDateTime } from "@/features/appointment/format";
import { isResourceId } from "@/server/modules/salon/salon.helpers";

/** Shows one authorized appointment with services and totals. */
export default async function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isResourceId(id)) notFound();
  const appointment = await getAppointment(id);
  if (!appointment) notFound();
  return <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12"><BackButton href={routes.appointments} variant="secondary" /><div className="mt-8 flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm text-muted-foreground">Appointment</p><h1 className="font-heading text-3xl font-semibold">{appointment.salon.name}</h1><p className="mt-2 text-muted-foreground">{formatAppointmentDateTime(appointment.startTime, appointment.salon.timezone)}</p></div><AppointmentStatusBadge status={appointment.status} /></div><section className="mt-8 rounded-xl border border-border bg-card p-5"><h2 className="font-heading text-lg font-semibold">Services</h2><div className="mt-4 divide-y divide-border">{appointment.services.map((line) => <div key={line.serviceId} className="flex justify-between gap-4 py-3"><div><p className="font-medium">{line.service.name}</p><p className="text-sm text-muted-foreground">{line.service.duration} min · {line.staff?.name ?? "Salon professional"}</p></div><p className="font-medium">{appointmentPriceFormatter.format(line.price)}</p></div>)}</div></section><section className="mt-4 rounded-xl border border-border bg-card p-5"><h2 className="font-heading text-lg font-semibold">Price summary</h2><dl className="mt-4 space-y-2 text-sm"><div className="flex justify-between"><dt>Subtotal</dt><dd>{appointmentPriceFormatter.format(appointment.subtotal)}</dd></div>{appointment.discount > 0 ? <div className="flex justify-between text-emerald-600"><dt>Discount</dt><dd>−{appointmentPriceFormatter.format(appointment.discount)}</dd></div> : null}<div className="flex justify-between"><dt>Tax</dt><dd>{appointmentPriceFormatter.format(appointment.tax)}</dd></div><div className="flex justify-between border-t border-border pt-3 text-base font-semibold"><dt>Total</dt><dd>{appointmentPriceFormatter.format(appointment.totalPrice)}</dd></div></dl></section>{appointment.notes ? <section className="mt-4 rounded-xl border border-border bg-card p-5"><h2 className="font-heading text-lg font-semibold">Notes</h2><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{appointment.notes}</p></section> : null}</main>;
}
