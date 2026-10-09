import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { SalonManageNav } from "@/features/salon/components/manage-nav";
import { SalonManagement } from "@/features/salon/components/management";
import { getSession } from "@/lib/auth/get-session";
import { SalonVerificationNotFoundError } from "@/server/modules/verification/verification.errors";
import { getSalonVerification } from "@/server/modules/verification/verification.service";
import { SalonNotFoundError, SalonRoleInsufficientError } from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Manage salon | Nikharta Roop",
  description: "Salon management cockpit: catalog, packages, verification, coupons, and settings.",
};

/**
 * Restricts salon management to members with MANAGER or OWNER access and
 * renders the manage cockpit: quick-action nav grid + the salon edit form
 * and member roster.
 */
export default async function SalonManagementPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/salons/${slug}/manage`)}`);

  let salon;
  let verification: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED" | null = null;
  try {
    [salon, verification] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      getSalonVerification(user.id, slug)
        .then((row) => row.status)
        .catch((error) => {
          if (error instanceof SalonVerificationNotFoundError) return null;
          throw error;
        }),
    ]);
  } catch (error) {
    if (error instanceof SalonNotFoundError || error instanceof SalonRoleInsufficientError) notFound();
    throw error;
  }

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6">
      <SalonManageNav
        salonSlug={salon.slug}
        salonName={salon.name}
        verification={verification}
      />
      <SalonManagement salon={salon} currentUserId={user.id} />
    </main>
  );
}
