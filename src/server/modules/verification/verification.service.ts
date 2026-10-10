import "server-only";

import { AdminAccessDeniedError } from "@/server/modules/admin/admin.errors";
import { assertRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { resolveSalonId } from "@/server/modules/service/service.repository";

import {
  SalonAlreadyVerifiedError,
  SalonVerificationNotFoundError,
  SalonVerificationSuspendedError,
} from "./verification.errors";
import {
  applyVerificationDecision,
  findVerificationBySalonId,
  listPendingVerifications as findPendingVerifications,
  submitVerification,
} from "./verification.repository";
import type {
  PendingVerificationRow,
  PublicSalonVerification,
  ReviewVerificationInput,
  SubmitVerificationInput,
} from "./verification.types";
import {
  reviewVerificationSchema,
  submitVerificationSchema,
} from "./verification.schema";

/** Loads the verification for a salon the caller manages. MANAGER+. */
export async function getSalonVerification(
  callerId: string,
  salonRef: string,
): Promise<PublicSalonVerification> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: callerId });
  if (!salon) throw new SalonNotFoundError();

  assertRoleAtLeast(salon.viewerRole, "MANAGER");

  const row = await findVerificationBySalonId(salonId);
  if (!row) throw new SalonVerificationNotFoundError();
  return row;
}

/**
 * Submits (or resubmits) verification documents. OWNER only.
 *
 * Why OWNER only:
 * Verification is a legal/business claim about the salon — managers and
 * staff should not be able to change who the platform has vetted.
 */
export async function submitSalonVerification(
  callerId: string,
  salonRef: string,
  input: SubmitVerificationInput,
): Promise<PublicSalonVerification> {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: callerId });
  if (!salon) throw new SalonNotFoundError();

  assertRoleAtLeast(salon.viewerRole, "OWNER");

  const existing = await findVerificationBySalonId(salonId);
  if (existing?.status === "VERIFIED") throw new SalonAlreadyVerifiedError();
  if (existing?.status === "SUSPENDED") {
    throw new SalonVerificationSuspendedError();
  }

  const validated = submitVerificationSchema.parse(input);
  return submitVerification(salonId, callerId, validated.documents);
}

/**
 * Applies an admin decision to a salon's verification. SUPER_ADMIN only.
 *
 * Why:
 * The proxy already gates `/api/v1/admin/*`, but the role is asserted here
 * too — defense in depth, and this function stays safe if it is ever called
 * from a non-admin-prefixed surface.
 */
export async function reviewSalonVerification(
  callerId: string,
  callerRole: string,
  salonRef: string,
  input: ReviewVerificationInput,
): Promise<PublicSalonVerification> {
  if (callerRole !== "SUPER_ADMIN") {
    throw new AdminAccessDeniedError();
  }

  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const existing = await findVerificationBySalonId(salonId);
  if (!existing) throw new SalonVerificationNotFoundError();
  if (existing.status === "VERIFIED" && input.status === "VERIFIED") {
    throw new SalonAlreadyVerifiedError();
  }

  const validated = reviewVerificationSchema.parse(input);
  return applyVerificationDecision({
    salonId,
    status: validated.status,
    reason: validated.reason ?? null,
    reviewerId: callerId,
    expectedUpdatedAt: validated.expectedUpdatedAt,
    evidence: validated.evidence,
  });
}

/**
 * Lists every PENDING verification with the salon fields the admin queue
 * renders. SUPER_ADMIN only.
 *
 * Why mirror the role check here:
 * The proxy already gates `/api/v1/admin/*`, but the admin Server Component
 * calls this directly. Asserting here keeps the function safe if it is ever
 * reused from a non-admin-prefixed surface, and matches the defense-in-depth
 * pattern used by `reviewSalonVerification`.
 */
export async function listPendingVerifications(
  callerRole: string,
): Promise<PendingVerificationRow[]> {
  if (callerRole !== "SUPER_ADMIN") {
    throw new AdminAccessDeniedError();
  }
  return findPendingVerifications();
}
