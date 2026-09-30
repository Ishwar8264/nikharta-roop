import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { CreateServiceForm } from "@/features/service/create-service-form";
import { getSession } from "@/lib/auth/get-session";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import { listAllServiceCategories } from "@/server/modules/service/service.service";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Create service · Nikharta Roop",
  description: "Add a bookable service to your salon catalogue.",
};

/** Protects and renders the salon service creation workflow. */
export default async function CreateSalonServicePage({ params }: PageProps) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) {
    const target = `/salons/${encodeURIComponent(slug)}/services/create`;
    redirect(`/login?redirect=${encodeURIComponent(target)}`);
  }

  let salon;
  try {
    salon = await getSalonForServiceManagement(slug, user.id);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    ) {
      notFound();
    }
    throw error;
  }

  const categories = await listAllServiceCategories();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <CreateServiceForm
        salonName={salon.name}
        salonSlug={salon.slug}
        categories={categories}
      />
    </main>
  );
}
