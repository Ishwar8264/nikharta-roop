import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { EmptyState } from "@/components/shared";
import { Badge } from "@/components/ui/badge";
import { getSession } from "@/lib/auth/get-session";
import { AdminVerificationRow } from "@/features/verification/admin-verification-row";
import type { SalonVerification } from "@/features/verification/api";
import { listPendingVerifications } from "@/server/modules/verification/verification.service";
import type { PendingVerificationRow } from "@/server/modules/verification/verification.types";

export const metadata: Metadata = {
  title: "Salon verification queue | Admin",
  description: "Pending salon verification submissions awaiting review.",
  robots: { index: false, follow: false },
};

/** Indian-English short date — matches the wiring doc's "d MMM yyyy" format. */
const submittedAtFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

/**
 * Admin review queue for pending salon verifications.
 *
 * Why defense-in-depth here:
 * The admin layout already gates SUPER_ADMIN, but re-asserting the role in the
 * page means this route stays safe if it is ever re-parented under a different
 * layout (or imported server-side from another surface).
 */
export default async function AdminVerificationQueuePage() {
  const user = await getSession();
  if (!user || user.role !== "SUPER_ADMIN") notFound();

  const rows = await listPendingVerifications(user.role);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-3xl font-semibold">
          Verification queue
        </h1>
        <p className="mt-2 text-muted-foreground">
          {rows.length === 0
            ? "No pending submissions."
            : `${rows.length} pending submission${rows.length === 1 ? "" : "s"}.`}
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Nothing to review"
          description="New salon submissions will appear here as they come in."
        />
      ) : (
        <ul className="divide-y rounded-xl border">
          {rows.map((row) => (
            <QueueRow key={row.salon.id} row={row} />
          ))}
        </ul>
      )}
    </div>
  );
}

interface QueueRowProps {
  row: PendingVerificationRow;
}

/** Renders the static content of one queue row; the action is a client island. */
function QueueRow({ row }: QueueRowProps) {
  const submittedAt = row.submittedAt
    ? submittedAtFormatter.format(row.submittedAt)
    : "—";

  // PendingVerificationRow has Date objects; the client-side admin review sheet
  // expects JSON-serialized (string) dates. Convert at the boundary.
  const verification: SalonVerification = {
    status: row.status,
    updatedAt: row.updatedAt.toISOString(),
    documents: row.documents,
    submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
    reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
    reason: row.reason,
  };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{row.salon.name}</span>
          <Badge variant="secondary">Pending</Badge>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {row.salon.city ? `${row.salon.city} · ` : ""}Submitted {submittedAt}
        </p>
      </div>
      <AdminVerificationRow
        salon={row.salon}
        verification={verification}
      />
    </li>
  );
}
