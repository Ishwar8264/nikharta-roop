import "server-only";

import { prisma } from "@/lib/prisma";

const PUBLIC_VERIFICATION_SELECT = {
  status: true,
  documents: true,
  submittedAt: true,
  reviewedAt: true,
  reason: true,
} as const;

/** Loads the verification row for a salon, or null. */
export async function findVerificationBySalonId(salonId: string) {
  return prisma.salonVerification.findUnique({
    where: { salonId },
    select: PUBLIC_VERIFICATION_SELECT,
  });
}

/**
 * Upserts the salon's verification into PENDING with fresh documents.
 *
 * Why upsert:
 * A salon may resubmit after a rejection, so the row usually exists. The
 * create path only runs on first submission. `reason` and `reviewedAt` are
 * cleared — a resubmission starts a fresh review.
 */
export async function submitVerification(
  salonId: string,
  documents: unknown,
) {
  return prisma.salonVerification.upsert({
    where: { salonId },
    update: {
      status: "PENDING",
      documents: documents as never,
      submittedAt: new Date(),
      reviewedAt: null,
      reviewedBy: null,
      reason: null,
    },
    create: {
      salonId,
      documents: documents as never,
      submittedAt: new Date(),
    },
    select: PUBLIC_VERIFICATION_SELECT,
  });
}

/**
 * Applies an admin decision and, on VERIFIED, flips the salon live.
 *
 * Why the transaction:
 * "Verified" and `isActive` must change together — a verified-but-hidden
 * salon (or vice versa) would be a trust bug visible to customers.
 */
export async function applyVerificationDecision(input: {
  salonId: string;
  status: "VERIFIED" | "REJECTED" | "SUSPENDED";
  reason: string | null;
  reviewerId: string;
}) {
  return prisma.$transaction(async (transaction) => {
    await transaction.salon.update({
      where: { id: input.salonId },
      data: { isActive: input.status === "VERIFIED" },
    });

    return transaction.salonVerification.update({
      where: { salonId: input.salonId },
      data: {
        status: input.status,
        reason: input.reason,
        reviewedAt: new Date(),
        reviewedBy: input.reviewerId,
      },
      select: PUBLIC_VERIFICATION_SELECT,
    });
  });
}
