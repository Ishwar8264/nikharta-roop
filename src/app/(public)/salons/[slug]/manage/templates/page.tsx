import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { ActivationPanel } from "@/features/catalog/activation-panel";
import type { ActivationRow } from "@/features/catalog/types";
import { getSession } from "@/lib/auth/get-session";
import {
  listCatalogTemplates,
  listSalonActivatedTemplates,
} from "@/server/modules/catalog/catalog.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Activate your services | Nikharta Roop",
  description:
    "Turn on ready-made services and packages, set your price, and go live in minutes.",
};

/** Catalog activation — the five-minute menu for new salon owners. */
export default async function ManageTemplatesPage({ params }: Props) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonTemplatesManage(slug))}`,
    );
  }

  let salonName = "";
  let rows: ActivationRow[] = [];
  try {
    const [salon, templates, activations] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      listCatalogTemplates({}),
      listSalonActivatedTemplates(slug),
    ]);
    salonName = salon.name;

    // Merge by template id; the catalog defines the card order.
    const byTemplateId = new Map(
      activations.map((activation) => [activation.templateId, activation]),
    );
    rows = templates.map((template) => {
      const activation = byTemplateId.get(template.id);
      return {
        template,
        activation: activation
          ? { price: activation.price, isActive: activation.isActive }
          : null,
      };
    });
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    ) {
      notFound();
    }
    throw error;
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <header className="max-w-2xl">
        <p className="text-sm text-muted-foreground">{salonName}</p>
        <h1 className="mt-2 font-heading text-3xl font-semibold">
          Activate your services
        </h1>
        <p className="mt-2 text-muted-foreground">
          Turn on what you offer and set your price. Customers see only active
          items.
        </p>
      </header>

      <div className="mt-8">
        <ActivationPanel salonSlug={slug} rows={rows} />
      </div>
    </main>
  );
}
