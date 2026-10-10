import "server-only";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import {
  approvalEvidenceSchema,
  submitVerificationSchema,
} from "./verification.schema";
import {
  VerificationConflictError,
  VerificationValidationError,
} from "./verification.errors";
import type {
  ReviewVerificationInput,
  SubmitVerificationInput,
} from "./verification.types";

const PUBLIC_VERIFICATION_SELECT = {
  status: true,
  documents: true,
  submittedAt: true,
  reviewedAt: true,
  reason: true,
  updatedAt: true,
} as const;

/** Loads the verification row for a salon, or null. */
export async function findVerificationBySalonId(salonId: string) {
  return prisma.salonVerification.findUnique({
    where: { salonId },
    select: PUBLIC_VERIFICATION_SELECT,
  });
}

/**
 * Lists PENDING verifications with the salon fields the admin queue needs.
 *
 * Why a separate repository function:
 * The admin review page is the only surface that consumes this shape, and
 * asking the service layer to expose it makes the role gate obvious. Ordering
 * by `submittedAt` asc keeps the oldest submissions on top — the salon that
 * waited longest should be reviewed first.
 */
export async function listPendingVerifications() {
  return prisma.salonVerification.findMany({
    where: {
      status: "PENDING",
      submittedAt: { not: null },
      salon: { deletedAt: null },
    },
    select: {
      ...PUBLIC_VERIFICATION_SELECT,
      submittedAt: true,
      salon: {
        select: {
          id: true,
          slug: true,
          name: true,
          city: true,
          address: true,
          state: true,
          zip: true,
        },
      },
    },
    orderBy: { submittedAt: "asc" },
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
  ownerId: string,
  documents: SubmitVerificationInput["documents"],
) {
  if (!submitVerificationSchema.safeParse({ documents }).success)
    throw new VerificationValidationError(
      "Upload all required proofs with distinct private media IDs",
    );
  return prisma.$transaction(async (transaction) => {
    await transaction.$queryRaw`SELECT id FROM "Salon" WHERE id = ${salonId} FOR UPDATE`;
    const salon = await transaction.salon.findFirst({
      where: {
        id: salonId,
        deletedAt: null,
        members: { some: { userId: ownerId, role: "OWNER" } },
      },
      select: { slug: true },
    });
    if (!salon)
      throw new VerificationValidationError(
        "Only the current owner can submit documents",
      );
    const existing = await transaction.salonVerification.findUnique({
      where: { salonId },
    });
    if (existing?.status === "VERIFIED" || existing?.status === "SUSPENDED")
      throw new VerificationConflictError();
    const assets = await transaction.mediaAsset.findMany({
      where: {
        id: { in: documents.map((document) => document.mediaId) },
        userId: ownerId,
        purpose: "VERIFICATION",
        attachedToType: "SALON_VERIFICATION",
        attachedToId: salonId,
        deletedAt: null,
      },
    });
    if (assets.length !== documents.length)
      throw new VerificationValidationError(
        "Use private verification uploads belonging to this salon owner",
      );
    const storedDocuments = documents.map((document) => ({
      ...document,
      url: `/api/v1/salons/${encodeURIComponent(salonId)}/verification/documents/${document.mediaId}`,
    }));
    await transaction.salon.update({
      where: { id: salonId },
      data: { isActive: false },
    });
    return transaction.salonVerification.upsert({
      where: { salonId },
      update: {
        status: "PENDING",
        documents: storedDocuments,
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
        reason: null,
      },
      create: {
        salonId,
        documents: storedDocuments,
        submittedAt: new Date(),
      },
      select: PUBLIC_VERIFICATION_SELECT,
    });
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
  expectedUpdatedAt: string;
  evidence?: ReviewVerificationInput["evidence"];
}) {
  return prisma.$transaction(async (transaction) => {
    // Submission and review share the same row lock so approval cannot race a replacement.
    await transaction.$queryRaw`SELECT id FROM "Salon" WHERE id = ${input.salonId} FOR UPDATE`;
    const salon = await transaction.salon.findFirst({
      where: { id: input.salonId, deletedAt: null },
      select: {
        members: {
          where: { userId: input.reviewerId },
          select: { role: true },
        },
      },
    });
    if (!salon || salon.members.length)
      throw new VerificationValidationError(
        "A salon member cannot review their own salon",
      );
    const existing = await transaction.salonVerification.findUnique({
      where: { salonId: input.salonId },
    });
    if (
      !existing ||
      existing.updatedAt.toISOString() !== input.expectedUpdatedAt
    )
      throw new VerificationConflictError();
    if (input.status === "VERIFIED") {
      if (
        existing.status !== "PENDING" ||
        !existing.submittedAt ||
        !approvalEvidenceSchema.safeParse(input.evidence).success
      )
        throw new VerificationValidationError(
          "Only a complete pending submission with official-source evidence can be approved",
        );
      const parsed = submitVerificationSchema.safeParse({
        documents: Array.isArray(existing.documents)
          ? existing.documents.map((entry) => {
              if (!entry || typeof entry !== "object" || Array.isArray(entry))
                return entry;
              return { kind: entry.kind, mediaId: entry.mediaId };
            })
          : existing.documents,
      });
      if (!parsed.success)
        throw new VerificationValidationError(
          "This legacy or incomplete submission must be resubmitted using private verification uploads",
        );
      const assets = await transaction.mediaAsset.count({
        where: {
          id: { in: parsed.data.documents.map((document) => document.mediaId) },
          purpose: "VERIFICATION",
          attachedToType: "SALON_VERIFICATION",
          attachedToId: input.salonId,
          deletedAt: null,
          user: {
            salonMemberships: {
              some: { salonId: input.salonId, role: "OWNER" },
            },
          },
        },
      });
      if (assets !== parsed.data.documents.length)
        throw new VerificationValidationError(
          "Verification documents are missing or no longer belong to the current owner",
        );
    }
    if (input.status === "REJECTED" && existing.status !== "PENDING")
      throw new VerificationConflictError();
    await transaction.salonVerificationReview.create({
      data: {
        verificationId: existing.id,
        reviewerId: input.reviewerId,
        status: input.status,
        reason: input.reason,
        submission: existing.documents ?? Prisma.JsonNull,
        evidence: input.evidence ?? Prisma.JsonNull,
      },
    });
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
