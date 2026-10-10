import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { SalonDirectoryLayout } from "@/features/salon/components/directory-layout";
import { getSession } from "@/lib/auth/get-session";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { getSalonSummaryBySlug } from "@/server/modules/salon/salon.service";

interface SalonLayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

/** Keeps salon navigation mounted across all nested salon routes. */
export default async function SalonLayout({ children, params }: SalonLayoutProps) {
  const { slug } = await params;

  const [publicSalon, user] = await Promise.all([
    getSalonSummaryBySlug(slug).catch((error) => {
      if (error instanceof SalonNotFoundError) return null;
      throw error;
    }),
    getSession(),
  ]);

  const membership = user
    ? await findSalonForViewer({ slug, userId: user.id })
    : null;
  const canManage = membership?.viewerRole === "OWNER" || membership?.viewerRole === "MANAGER";
  // The layout also wraps onboarding pages for salons that are not public yet.
  const salon = publicSalon ?? (canManage ? membership : null);
  if (!salon) notFound();

  return (
    <SalonDirectoryLayout
      isSignedIn={Boolean(user)}
      salon={{ name: salon.name, slug: salon.slug, canManage, isPublic: Boolean(publicSalon) }}
    >
      {children}
    </SalonDirectoryLayout>
  );
}
