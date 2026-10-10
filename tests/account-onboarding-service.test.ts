import { beforeEach, describe, expect, it, vi } from "vitest";
import { PARTNER_TERMS_VERSION } from "../src/features/onboarding/policy";
const mocks = vi.hoisted(() => ({
  findFirst: vi.fn(),
  update: vi.fn(),
  query: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("../src/lib/prisma", () => ({
  prisma: {
    user: { findFirst: mocks.findFirst },
    $transaction: mocks.transaction,
  },
}));
import {
  completeOnboarding,
  saveOnboardingIntent,
  requirePartnerOnboarding,
  PartnerOnboardingRequiredError,
} from "../src/server/modules/auth/onboarding.service";
import { AccountDeactivatedError } from "../src/server/modules/auth/auth.errors";

const input = {
  accountType: "SALON_PARTNER" as const,
  name: "Owner",
  phone: "+919876543210",
  authorised: true,
  acceptTerms: true,
  termsVersion: PARTNER_TERMS_VERSION,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.findFirst.mockResolvedValue({
    id: "user",
    phone: null,
    phoneVerified: false,
  });
  mocks.update.mockImplementation(async (args) => args.data);
  mocks.transaction.mockImplementation(async (fn) =>
    fn({
      $queryRaw: mocks.query,
      user: { findFirst: mocks.findFirst, update: mocks.update },
    }),
  );
});

describe("onboarding persistence and creation gate", () => {
  it("stores partner completion and consent together with server time", async () => {
    await completeOnboarding("user", input);
    const data = mocks.update.mock.calls[0][0].data;
    expect(data.partnerCompletedAt).toBeInstanceOf(Date);
    expect(data.partnerTermsAcceptedAt).toEqual(data.partnerCompletedAt);
    expect(data.partnerTermsVersion).toBe(PARTNER_TERMS_VERSION);
    expect(data.phoneVerified).toBe(false);
    expect(data).not.toHaveProperty("role");
    expect(data).not.toHaveProperty("salonMemberships");
    expect(mocks.query).toHaveBeenCalledOnce();
  });
  it("keeps original consent on retry and verified status for unchanged phone", async () => {
    const date = new Date("2026-10-01");
    mocks.findFirst.mockResolvedValue({
      id: "user",
      phone: input.phone,
      phoneVerified: true,
      partnerCompletedAt: date,
      partnerTermsAcceptedAt: date,
      onboardingCompletedAt: date,
    });
    await completeOnboarding("user", input);
    const data = mocks.update.mock.calls[0][0].data;
    expect(data.onboardingCompletedAt).toBe(date);
    expect(data).not.toHaveProperty("partnerCompletedAt");
    expect(data).not.toHaveProperty("partnerTermsAcceptedAt");
    expect(data).not.toHaveProperty("phoneVerified");
  });
  it("does not erase partner eligibility when completing as a customer", async () => {
    const data = await completeOnboarding("user", {
      accountType: "CUSTOMER",
      name: "Owner",
    });
    expect(data.accountType).toBe("CUSTOMER");
    expect(data).not.toHaveProperty("partnerCompletedAt");
    expect(data).not.toHaveProperty("partnerEligibilityBackfilledAt");
  });
  it("saves a skipped partner draft without marking it complete", async () => {
    const data = await saveOnboardingIntent("user", {
      accountType: "SALON_PARTNER",
      name: "Owner",
      phone: input.phone,
    });
    expect(data.accountType).toBe("SALON_PARTNER");
    for (const key of [
      "isOnboarded",
      "onboardingCompletedAt",
      "partnerCompletedAt",
      "partnerTermsAcceptedAt",
    ])
      expect(data).not.toHaveProperty(key);
  });
  it("rejects deleted accounts without writes", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(completeOnboarding("deleted", input)).rejects.toBeInstanceOf(
      AccountDeactivatedError,
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("blocks new users, customers, managers and administrators until eligible", async () => {
    for (const user of [
      null,
      { accountType: "CUSTOMER" },
      { accountType: "SALON_PARTNER" },
      { role: "SUPER_ADMIN" },
      { role: "MANAGER" },
    ]) {
      mocks.findFirst.mockResolvedValue(user);
      await expect(requirePartnerOnboarding("user")).rejects.toBeInstanceOf(
        PartnerOnboardingRequiredError,
      );
    }
    expect(mocks.findFirst).toHaveBeenLastCalledWith({
      where: { id: "user", deletedAt: null },
    });
  });
  it("allows completed partners and migrated owners", async () => {
    for (const user of [
      {
        partnerCompletedAt: new Date(),
        partnerTermsAcceptedAt: new Date(),
        partnerTermsVersion: PARTNER_TERMS_VERSION,
      },
      { partnerEligibilityBackfilledAt: new Date() },
    ]) {
      mocks.findFirst.mockResolvedValue(user);
      await expect(requirePartnerOnboarding("user")).resolves.toBeUndefined();
    }
  });
});
