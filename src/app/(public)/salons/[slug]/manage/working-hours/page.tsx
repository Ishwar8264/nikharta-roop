import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { WorkingHoursForm } from "@/features/working-hours";
import { getSession } from "@/lib/auth/get-session";
import { WorkingHoursSalonNotFoundError } from "@/server/modules/salon-working-hours/working-hours.errors";
import { getSalonWorkingHours } from "@/server/modules/salon-working-hours/working-hours.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Salon working hours | Nikharta Roop",
  description:
    "Set the weekly opening hours customers see on your public salon page.",
};

/**
 * Salon-manage page for the weekly schedule. MANAGER+ gated.
 *
 * Why the read uses `getSalonWorkingHours` (public) and not a manager-only
 * variant: the GET endpoint is intentionally public — anyone browsing the
 * salon detail page already sees the same hours. The owner gate is on the
 * PUT side (`replaceSalonWorkingHours` enforces MANAGER+), so the page only
 * needs to confirm management access for the manage chrome (nav, back link).
 */
export default async function ManageWorkingHoursPage({ params }: Props) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(
        routes.salonWorkingHoursManage(slug),
      )}`,
    );
  }

  let salonName = "";
  let hours;
  try {
    [salonName, hours] = await Promise.all([
      getSalonForServiceManagement(slug, user.id).then((salon) => salon.name),
      getSalonWorkingHours(slug),
    ]);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError ||
      error instanceof WorkingHoursSalonNotFoundError
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <WorkingHoursForm
        salonSlug={slug}
        salonName={salonName}
        initial={hours}
      />
    </main>
  );
}
