import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { AddStaffForm } from "@/features/staff/add-staff-form";
import { getSession } from "@/lib/auth/get-session";
import { findSalonForViewer, findSalonMemberBySlug } from "@/server/modules/salon/salon.repository";
import { findStaffMemberInSalon } from "@/server/modules/staff/staff.repository";
import { isResourceId } from "@/server/modules/salon/salon.helpers";

export const metadata: Metadata = { title: "Edit staff | Nikharta Roop" };

/** Match the PATCH permission: salon owners and members editing their own profile. */
export default async function EditStaffPage({ params }: { params: Promise<{ slug: string; staffId: string }> }) {
  const { slug, staffId: staffRef } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(routes.salonStaffEdit(slug, staffRef))}`);
  const salon = await findSalonForViewer({ slug, userId: user.id });
  if (!salon) notFound();
  const memberId = isResourceId(staffRef) ? staffRef : (await findSalonMemberBySlug(salon.id, staffRef))?.id;
  if (!memberId) notFound();
  const member = await findStaffMemberInSalon(memberId, salon.id);
  if (!member || (salon.viewerRole !== "OWNER" && member.userId !== user.id)) notFound();
  return (
    <main className="mx-auto w-full max-w-3xl">
      <AddStaffForm salonId={salon.id} salonSlug={salon.slug} salonName={salon.name} member={member} />
    </main>
  );
}
