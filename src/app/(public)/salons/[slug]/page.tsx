import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { SalonDetail } from "@/features/salon/components/details/detail";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
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

    return {
      title: `${salon.name} · Nikharta Roop`,
      description,
      openGraph: {
        title: salon.name,
        description,
        images: salon.images[0] ? [salon.images[0]] : undefined,
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

  return <SalonDetail salon={salon} />;
}
