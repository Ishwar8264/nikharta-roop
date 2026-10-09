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

  let salon;
  let user;
  try {
    [salon, user] = await Promise.all([
      getSalonSummaryBySlug(slug),
      getSession(),
    ]);
  } catch (error) {
    if (error instanceof SalonNotFoundError) notFound();
    throw error;
  }

  const membership = user
    ? await findSalonForViewer({ salonId: salon.id, userId: user.id })
    : null;
  const canManage = membership?.viewerRole === "OWNER" || membership?.viewerRole === "MANAGER";

  return (
    <SalonDirectoryLayout
      isSignedIn={Boolean(user)}
      salon={{ name: salon.name, slug: salon.slug, canManage }}
    >
      {children}
    </SalonDirectoryLayout>
  );
}
