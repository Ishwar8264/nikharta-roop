import Link from "next/link";
import { CalendarX2 } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { NavLink } from "@/components/shared/nav-link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { routes } from "@/config/routes";
import { AppointmentStatusBadge } from "@/features/appointment/appointment-ui";
import { appointmentPriceFormatter, formatAppointmentTime } from "@/features/appointment/format";
import type { PublicAppointment } from "@/features/appointment/types";

interface SalonAppointmentListProps {
  salonSlug: string;
  /**
   * Already-resolved appointment rows for the current filter / cursor page.
   * Each row carries `customer` (added in Round 4-A) so the salon owner can
   * see who is in the chair without opening the detail page.
   */
  appointments: PublicAppointment[];
}

/**
 * Salon-side appointment list — mobile cards + desktop table.
 *
 * Why a Server Component (no "use client"):
 * The rows are pure presentation — every interactive bit is a `<Link>` /
 * `<NavLink>` (both client components used here as JSX children). Nothing in
 * this file needs `useState` / `useEffect`. Mirrors the existing
 * `AppointmentCard` in `appointment-ui.tsx`. The status-filter chips above
 * this list live in the page (server-rendered `<Link>`s) so the whole
 * manage-appointments route stays statically server-rendered and crawlable.
 *
 * Why two layouts (cards + table):
 * On a phone, an appointment's customer + services + time + status + price
 * + action do not fit in a single table row — the cells would truncate or
 * wrap into unreadable slabs. A stacked card keeps each appointment scannable
 * in one thumb-sweep. On `lg` and up, the same data fits cleanly into a
 * table row, which lets an owner scan 20+ rows without scrolling past cards.
 */
export function SalonAppointmentList({
  salonSlug,
  appointments,
}: SalonAppointmentListProps) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        icon={CalendarX2}
        title="No appointments for this filter today."
        description="Try clearing the filter to see every appointment scheduled for today."
        action={
          <NavLink
            href={routes.salonAppointmentsManage(salonSlug)}
            variant="default"
            markActive={false}
          >
            Clear filters
          </NavLink>
        }
      />
    );
  }

  return (
    <>
      {/* Mobile / tablet: stacked cards */}
      <ul className="space-y-3 lg:hidden">
        {appointments.map((appointment) => (
          <SalonAppointmentCard
            key={appointment.id}
            appointment={appointment}
          />
        ))}
      </ul>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border lg:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3 font-medium">
                Customer
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Services
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Time
              </th>
              <th scope="col" className="px-4 py-3 font-medium">
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-right font-medium"
              >
                Price
              </th>
              <th scope="col" className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {appointments.map((appointment) => (
              <SalonAppointmentRow
                key={appointment.id}
                appointment={appointment}
              />
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Mobile-friendly card for a single appointment. */
function SalonAppointmentCard({
  appointment,
}: {
  appointment: PublicAppointment;
}) {
  const customerName = appointment.customer.name ?? "Customer";
  const serviceSummary = summarizeServices(appointment);
  const href = routes.appointmentDetail(appointment.id);

  return (
    <li className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <CustomerCell appointment={appointment} />
        <AppointmentStatusBadge status={appointment.status} />
      </div>

      <p className="mt-3 text-sm text-muted-foreground">{serviceSummary}</p>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="font-medium text-foreground">
          {formatAppointmentTime(
            appointment.startTime,
            appointment.salon.timezone,
          )}
        </span>
        <span className="font-medium">
          {appointmentPriceFormatter.format(appointment.totalPrice)}
        </span>
      </div>

      <div className="mt-4">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={href} />}
          aria-label={`View appointment for ${customerName}`}
        >
          View
        </Button>
      </div>
    </li>
  );
}

/** Table row for a single appointment (desktop). */
function SalonAppointmentRow({
  appointment,
}: {
  appointment: PublicAppointment;
}) {
  const href = routes.appointmentDetail(appointment.id);

  return (
    <tr className="hover:bg-muted/40">
      <td className="px-4 py-3 align-middle">
        <CustomerCell appointment={appointment} compact />
      </td>
      <td className="max-w-xs px-4 py-3 align-middle">
        <p className="truncate text-muted-foreground">
          {summarizeServices(appointment)}
        </p>
      </td>
      <td className="whitespace-nowrap px-4 py-3 align-middle font-medium">
        {formatAppointmentTime(
          appointment.startTime,
          appointment.salon.timezone,
        )}
      </td>
      <td className="px-4 py-3 align-middle">
        <AppointmentStatusBadge status={appointment.status} />
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-right align-middle font-medium">
        {appointmentPriceFormatter.format(appointment.totalPrice)}
      </td>
      <td className="px-4 py-3 text-right align-middle">
        <Button
          variant="outline"
          size="sm"
          render={<Link href={href} />}
          aria-label={`View appointment for ${
            appointment.customer.name ?? "Customer"
          }`}
        >
          View
        </Button>
      </td>
    </tr>
  );
}

/**
 * Customer avatar + name. `compact` shrinks the avatar for dense table rows.
 *
 * Why "Customer" fallback:
 * The schema allows `name` to be null (phone-only onboarding is common in
 * the Indian salon market). The fallback keeps the row legible without
 * inventing a fake name; the owner can still tap through to see the phone.
 */
function CustomerCell({
  appointment,
  compact = false,
}: {
  appointment: PublicAppointment;
  compact?: boolean;
}) {
  const name = appointment.customer.name ?? "Customer";
  const initial = (appointment.customer.name?.trim()[0] ?? "?").toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <Avatar size={compact ? "sm" : "default"}>
        {appointment.customer.avatar ? (
          <AvatarImage
            src={appointment.customer.avatar}
            alt={name}
          />
        ) : null}
        <AvatarFallback>{initial}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium leading-tight">{name}</p>
        {appointment.customer.phone ? (
          <p
            className={cn(
              "truncate text-xs text-muted-foreground",
              compact && "text-[11px]",
            )}
          >
            {appointment.customer.phone}
          </p>
        ) : null}
      </div>
    </div>
  );
}

/** Joins service names with " · " — mirrors the public salon-detail pattern. */
function summarizeServices(appointment: PublicAppointment): string {
  if (appointment.services.length === 0) return "No services";
  return appointment.services
    .map((line) => line.service.name)
    .filter(Boolean)
    .join(" · ");
}
