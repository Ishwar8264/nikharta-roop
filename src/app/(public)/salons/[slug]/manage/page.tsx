import { notFound, redirect } from "next/navigation";

import { SalonManagement } from "@/features/salon/components/management";
import { getSession } from "@/lib/auth/get-session";
import { SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Restricts salon management to members with MANAGER or OWNER access. */
export default async function SalonManagementPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/salons/${slug}/manage`)}`);

  let salon;
  try {
    salon = await getSalonForServiceManagement(slug, user.id);
  } catch (error) {
    if (error instanceof SalonNotFoundError || error instanceof SalonRoleInsufficientError) notFound();
    throw error;
  }

  return <SalonManagement salon={salon} currentUserId={user.id} />;
}
