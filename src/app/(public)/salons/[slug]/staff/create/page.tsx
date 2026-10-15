import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { AddStaffForm } from "@/features/staff/add-staff-form";
import { getSession } from "@/lib/auth/get-session";
import { SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

export const metadata: Metadata = {
  title: "Add staff · Nikharta Roop",
  description: "Create a staff profile for your salon team.",
};

/** Matches the owner-only membership API before rendering the creation form. */
export default async function AddStaffPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(routes.salonStaffCreate(slug))}`);

  let salon;
  try {
    salon = await getSalonForServiceManagement(slug, user.id);
  } catch (error) {
    if (error instanceof SalonNotFoundError || error instanceof SalonRoleInsufficientError) notFound();
    throw error;
  }
  if (salon.viewerRole !== "OWNER") notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <AddStaffForm salonId={salon.id} salonSlug={salon.slug} salonName={salon.name} />
    </main>
  );
}
