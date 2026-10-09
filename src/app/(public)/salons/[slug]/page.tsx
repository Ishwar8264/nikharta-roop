import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { SalonDetail } from "@/features/salon/components/details/detail";
import { getSession } from "@/lib/auth/get-session";
import { checkFavorite } from "@/server/modules/favorite/favorite.service";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { getSalonBySlug } from "@/server/modules/salon/salon.service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * React `cache` dedupes identical calls within one request. Without it,
 * generateMetadata and the page component would hit the DB twice for the
 * same salon — same request, same slug, same result.
 */
const getSalon = cache(getSalonBySlug);

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const salon = await getSalon(slug);
    const description =
      salon.shortDescription ??
      salon.description?.slice(0, 160) ??
      `${salon.name} in ${salon.city}, ${salon.state}.`;

    const socialImage = salon.bannerImage ?? salon.coverImage ?? salon.images[0];

    return {
      title: `${salon.name} · Nikharta Roop`,
      description,
      openGraph: {
        title: salon.name,
        description,
        images: socialImage ? [socialImage] : undefined,
        type: "website",
      },
    };
  } catch {
    return { title: "Salon not found · Nikharta Roop" };
  }
}

export default async function SalonDetailPage({ params }: PageProps) {
  const { slug } = await params;

  let salon;
  try {
    salon = await getSalon(slug);
  } catch (error) {
    // notFound() throws a special error that renders not-found.tsx.
    // Everything else bubbles up to error.tsx.
    if (error instanceof SalonNotFoundError) notFound();
    throw error;
  }

  const user = await getSession();
  /**
   * Why both `membership` and `favoriteCheck` resolve in parallel:
   * They are independent reads — the membership gates the "Manage" button
   * (role-based), the favorite check gates the heart (ownership-based).
   * Running them together keeps the salon detail's server round-trip at one
   * wave instead of two.
   */
  const [membership, favoriteCheck] = await Promise.all([
    user
      ? findSalonForViewer({ salonId: salon.id, userId: user.id })
      : Promise.resolve(null),
    user
      ? checkFavorite(user.id, "salon", salon.id)
      : Promise.resolve({ isFavorited: false, favoriteId: null }),
  ]);

  const canManage = membership?.viewerRole === "OWNER" || membership?.viewerRole === "MANAGER";

  return (
    <SalonDetail
      salon={salon}
      canEdit={canManage}
      isFavorited={favoriteCheck.isFavorited}
      favoriteId={favoriteCheck.favoriteId}
      currentUserId={user?.id ?? null}
    />
  );
}
