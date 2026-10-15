import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

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
  title: "Edit salon | Nikharta Roop",
  description: "Edit your salon profile and team membership.",
};

/** Restricts salon profile editing to members with MANAGER or OWNER access. */
export default async function SalonManagementPage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/salons/${slug}/edit`)}`);

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
    <SalonManagement salon={salon} currentUserId={user.id} verification={verification} />
  );
}
