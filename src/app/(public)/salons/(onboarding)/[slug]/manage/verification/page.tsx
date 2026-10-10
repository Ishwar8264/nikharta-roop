import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { routes } from "@/config/routes";
import { VerificationPanel } from "@/features/verification/verification-panel";
import type { SalonVerification } from "@/features/verification/api";
import { getSession } from "@/lib/auth/get-session";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { getSalonForServiceManagement } from "@/server/modules/salon/salon.service";
import { getSalonVerification } from "@/server/modules/verification/verification.service";
import { SalonVerificationNotFoundError } from "@/server/modules/verification/verification.errors";

interface Props {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = {
  title: "Salon verification | Nikharta Roop",
  description:
    "Submit your shop license, ID, and salon photos. We review most submissions within 1–2 business days.",
};

/**
 * Owner view of salon verification status + the submit/resubmit form.
 *
 * Why the try/catch around `getSalonVerification`:
 * New salons have no verification row yet — the service throws
 * `SalonVerificationNotFoundError` for that case. We collapse it to a default
 * "PENDING, never submitted" shape so the panel can show the onboarding step
 * without a second code path.
 */
export default async function ManageVerificationPage({ params }: Props) {
  const { slug } = await params;
  const user = await getSession();
  if (!user) {
    redirect(
      `/login?redirect=${encodeURIComponent(routes.salonVerification(slug))}`,
    );
  }

  let salon;
  let verification: SalonVerification;
  try {
    [salon, verification] = await Promise.all([
      getSalonForServiceManagement(slug, user.id),
      loadVerification(user.id, slug),
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

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <header className="space-y-4">
        <Link
          href={routes.salonManage(slug)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to salon management
        </Link>
      </header>

      <div>
        <VerificationPanel
          salonSlug={slug}
          salonName={salon.name}
          initial={verification}
          canSubmit={salon.viewerRole === "OWNER"}
        />
      </div>
    </main>
  );
}

/**
 * Loads the verification row, or returns a default "no row yet" shape.
 *
 * Why a synthetic default:
 * The panel reads `submittedAt === null` to decide whether to show the
 * onboarding form. Reusing the same shape for "no row" and "first submit"
 * keeps the panel logic single-pathed.
 */
async function loadVerification(
  callerId: string,
  slug: string,
): Promise<SalonVerification> {
  const empty: SalonVerification = {
    status: "PENDING",
    documents: null,
    submittedAt: null,
    reviewedAt: null,
    reason: null,
  };
  try {
    const row = await getSalonVerification(callerId, slug);
    return {
      status: row.status,
      documents: row.documents,
      // Date → string: client components receive JSON-serialized props.
      submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
      reviewedAt: row.reviewedAt ? row.reviewedAt.toISOString() : null,
      reason: row.reason,
    };
  } catch (error) {
    if (error instanceof SalonVerificationNotFoundError) {
      return empty;
    }
    throw error;
  }
}
