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
import { getSalonForStaffAccess } from "@/server/modules/salon/salon.service";
import type { PublicCustomerNote } from "@/server/modules/customer-note/customer-note.types";
import type { PublicCustomerSummary } from "@/server/modules/users/users.types";
import { getCustomerSummary } from "@/server/modules/users/users.service";

interface PageProps {
  params: Promise<{ slug: string; customerId: string }>;
}

export const metadata: Metadata = {
  title: "Customer notes | Nikharta Roop",
  robots: { index: false },
};

/**
 * Staff-facing notes timeline for one customer of one salon. The page gates on
 * salon membership via `getSalonForStaffAccess`, so any STAFF+ member of the
 * salon can read the notes; finer-grained rules (who may delete a note) live
 * in `deleteCustomerNote`. We safely load the customer summary (name) alongside
 * the notes in a single `Promise.all`. When the customer row is missing or
 * soft-deleted we fall back to a truncated-id label so the page still renders.
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
  let customer: PublicCustomerSummary | null;
  try {
    [salon, notes, customer] = await Promise.all([
      getSalonForStaffAccess(slug, user.id),
      listCustomerNotes(user.id, slug, customerId),
      getCustomerSummary(customerId),
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

  const customerLabel = customer?.name ?? `Customer ${customerId.slice(-6)}`;

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
        customerName={customer?.name ?? undefined}
        customerAvatar={customer?.avatar ?? undefined}
      />
    </main>
  );
}
