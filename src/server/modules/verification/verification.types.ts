import type { z } from "zod";

import type { SalonVerificationStatus } from "@/generated/prisma/client";

import type {
  reviewVerificationSchema,
  submitVerificationSchema,
} from "./verification.schema";

export type SubmitVerificationInput = z.infer<typeof submitVerificationSchema>;
export type ReviewVerificationInput = z.infer<typeof reviewVerificationSchema>;

/** Verification row returned to the salon owner. */
export interface PublicSalonVerification {
  status: SalonVerificationStatus;
  documents: unknown | null;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  reason: string | null;
}
