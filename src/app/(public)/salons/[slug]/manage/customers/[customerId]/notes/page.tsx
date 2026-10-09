import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { NotesTimeline } from "@/features/customer-note";
import { routes } from "@/config/routes";
import { getSession } from "@/lib/auth/get-session";
import { listCustomerNotes } from "@/server/modules/customer-note/customer-note.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import type { PublicCustomerNote } from "@/server/modules/customer-note/customer-note.types";

interface PageProps {
  params: Promise<{ slug: string; customerId: string }>;
}

export const metadata: Metadata = {
  title: "Customer notes | Nikharta Roop",
  robots: { index: false },
};

/**
 * Staff-facing notes timeline for one customer of one salon. The page only
 * needs the customer's id (the customer is reached via an appointment's
 * customer row), so we don't fetch a customer name — we surface the id
 * truncated for orientation instead.
 */
export default async function CustomerNotesPage({ params }: PageProps) {
  const { slug, customerId } = await params;
  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(
        routes.salonCustomerNotes(slug, customerId),
      )}`,
    );
  }

  let salon;
  let notes: PublicCustomerNote[];
  try {
    [salon, notes] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      listCustomerNotes(user.id, slug, customerId),
    ]);
  } catch (error) {
    if (
      error instanceof SalonNotFoundError ||
      error instanceof SalonRoleInsufficientError
    ) {
      notFound();
    }
    throw error;
  }

  const customerLabel = `Customer ${customerId.slice(-6)}`;

  return (
    <main className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-2">
        <Link
          href={routes.salonManage(slug)}
          className="text-sm text-primary underline"
        >
          Back to manage
        </Link>
        <h1 className="font-heading text-3xl font-semibold">Customer notes</h1>
        <p className="text-muted-foreground">
          {salon.name} · {customerLabel}
        </p>
      </header>

      <NotesTimeline
        salonSlug={slug}
        customerId={customerId}
        initial={notes.map((note) => ({
          ...note,
          createdAt: note.createdAt.toISOString(),
        }))}
        currentUserId={user.id}
        currentUserRole={salon.viewerRole}
      />
    </main>
  );
}
