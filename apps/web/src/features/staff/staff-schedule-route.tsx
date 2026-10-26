import { notFound, redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import { findSalonMemberBySlug } from "@/server/modules/salon/salon.repository";
import { isResourceId } from "@/server/modules/salon/salon.helpers";
import { SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { getStaffDetail, getSchedule } from "@/server/modules/staff/staff.service";
import { StaffNotFoundError, StaffRoleInsufficientError } from "@/server/modules/staff/staff.errors";
import { StaffScheduleEditor } from "./staff-schedule-editor";

/** Both route surfaces enforce the same owner-only permission before loading the editor. */
export async function StaffScheduleRoute({ params, modal = false }: {
  params: Promise<{ slug: string; staffId: string }>; modal?: boolean;
}) {
  const { slug, staffId: staffRef } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(routes.salonStaffSchedule(slug, staffRef))}`);
  let staff;
  let schedule;
  try {
    const salon = await getSalonForServiceManagement(slug, user.id);
    if (salon.viewerRole !== "OWNER") notFound();
    const memberId = isResourceId(staffRef) ? staffRef : (await findSalonMemberBySlug(salon.id, staffRef))?.id;
    if (!memberId) notFound();
    [staff, schedule] = await Promise.all([getStaffDetail(user.id, slug, memberId), getSchedule(user.id, slug, memberId)]);
  } catch (error) {
    if (error instanceof SalonNotFoundError || error instanceof SalonRoleInsufficientError || error instanceof StaffNotFoundError || error instanceof StaffRoleInsufficientError) notFound();
    throw error;
  }
  const editor = <StaffScheduleEditor salonSlug={slug} staffId={staff.id} schedule={schedule} detailHref={routes.salonStaffDetail(slug, staff.slug ?? staff.id)} modal={modal} />;
  return modal ? editor : <main className="mx-auto w-full max-w-3xl">{editor}</main>;
}
