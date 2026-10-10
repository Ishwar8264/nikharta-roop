import "server-only";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canCreateSalon } from "@/features/onboarding/policy";
import { AccountDeactivatedError } from "./auth.errors";
import type {
  onboardingSchema,
  onboardingDraftSchema,
} from "./onboarding.schema";

export class PartnerOnboardingRequiredError extends Error {
  constructor() {
    super("Complete salon partner setup before adding a salon.");
  }
}

/** Re-read eligibility from the database for every salon creation. */
export async function requirePartnerOnboarding(userId: string): Promise<void> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user || !canCreateSalon(user))
    throw new PartnerOnboardingRequiredError();
}

/** Lock the user so simultaneous retries preserve the original consent timestamp. */
export async function completeOnboarding(
  userId: string,
  input: z.infer<typeof onboardingSchema>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const user = await tx.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new AccountDeactivatedError();
    const now = new Date();
    const partner = input.accountType === "SALON_PARTNER";
    return tx.user.update({
      where: { id: userId },
      data: {
        name: input.name,
        ...(input.phone && input.phone !== user.phone
          ? { phone: input.phone, phoneVerified: false }
          : {}),
        accountType: input.accountType,
        isOnboarded: true,
        onboardingCompletedAt: user.onboardingCompletedAt ?? now,
        ...(partner && !user.partnerCompletedAt
          ? {
              partnerCompletedAt: now,
              partnerTermsAcceptedAt: now,
              partnerTermsVersion: input.termsVersion,
            }
          : {}),
      },
      select: { accountType: true, onboardingCompletedAt: true },
    });
  });
}

/** Saving intent is safe to skip: it never grants partner eligibility. */
export async function saveOnboardingIntent(
  userId: string,
  input: z.infer<typeof onboardingDraftSchema>,
) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    const user = await tx.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) throw new AccountDeactivatedError();
    return tx.user.update({
      where: { id: userId },
      data: {
        accountType: input.accountType,
        ...(input.name ? { name: input.name } : {}),
        ...(input.phone && input.phone !== user.phone
          ? { phone: input.phone, phoneVerified: false }
          : {}),
      },
      select: { accountType: true },
    });
  });
}
