import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { SettingsForm } from "@/features/salon-settings";
import type { SalonSettings } from "@/features/salon-settings";
import { getSession } from "@/lib/auth/get-session";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import { getSalonSettings } from "@/server/modules/salon-settings/salon-settings.service";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Salon settings | Nikharta Roop",
  description:
    "Update your salon's booking buffers, advance payment rules, and walk-in policy.",
};

/** Server page for the salon settings form. */
export default async function ManageSettingsPage({ params }: Props) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonSettingsManage(slug))}`,
    );
  }

  let salonName = "";
  let settings: SalonSettings;
  let canEdit = false;
  try {
    const [salon, salonSettings] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      getSalonSettings(user.id, slug),
    ]);
    salonName = salon.name;
    canEdit = salon.viewerRole === "MANAGER" || salon.viewerRole === "OWNER";
    settings = salonSettings;
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm text-muted-foreground">{salonName}</p>
        <h1 className="font-heading text-3xl font-semibold">Salon settings</h1>
        <p className="text-muted-foreground">
          Booking buffers, payment rules, and walk-in policy. Changes take
          effect for new bookings immediately.
        </p>
      </header>

      <div className="mt-8">
        <SettingsForm salonSlug={slug} initial={settings} canEdit={canEdit} />
      </div>
    </main>
  );
}
