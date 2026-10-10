import { describe, expect, it } from "vitest";
import {
  canCreateSalon,
  isOnboardingComplete,
  onboardingDestination,
  PARTNER_TERMS_VERSION,
} from "../src/features/onboarding/policy";
import {
  onboardingSchema,
  onboardingDraftSchema,
} from "../src/features/onboarding/schema";

const partner = {
  accountType: "SALON_PARTNER",
  name: "Salon Owner",
  phone: "+919876543210",
  authorised: true,
  acceptTerms: true,
  termsVersion: PARTNER_TERMS_VERSION,
};

describe("account onboarding policy", () => {
  it("does not grant creation eligibility from intent, profile completion or platform role", () => {
    for (const role of ["USER", "SUPER_ADMIN", "MANAGER"]) {
      const user = {
        role,
        accountType: "SALON_PARTNER",
        isOnboarded: true,
        onboardingCompletedAt: new Date(),
      };
      expect(canCreateSalon(user)).toBe(false);
      expect(isOnboardingComplete(user)).toBe(false);
    }
  });
  it("preserves customer access and eligibility when a partner chooses booking", () => {
    const user = {
      accountType: "CUSTOMER",
      onboardingCompletedAt: new Date(),
      partnerCompletedAt: new Date(),
      partnerTermsAcceptedAt: new Date(),
      partnerTermsVersion: PARTNER_TERMS_VERSION,
    };
    expect(canCreateSalon(user)).toBe(true);
    expect(isOnboardingComplete(user)).toBe(true);
  });
  it("allows backfilled owners without inventing consent", () => {
    expect(canCreateSalon({ partnerEligibilityBackfilledAt: new Date() })).toBe(
      true,
    );
    expect(canCreateSalon({ partnerCompletedAt: new Date() })).toBe(false);
  });
  it("requires explicit consent, authority, valid phone and current terms for new partners", () => {
    expect(onboardingSchema.safeParse(partner).success).toBe(true);
    for (const change of [
      { phone: undefined },
      { authorised: false },
      { acceptTerms: false },
      { termsVersion: "old" },
      { role: "SUPER_ADMIN" },
      { userId: "another-user" },
    ]) {
      expect(
        onboardingSchema.safeParse({ ...partner, ...change }).success,
      ).toBe(false);
    }
  });
  it("allows customers to complete without business details and drafts without consent", () => {
    expect(
      onboardingSchema.safeParse({ accountType: "CUSTOMER", name: "Customer" })
        .success,
    ).toBe(true);
    expect(
      onboardingDraftSchema.safeParse({ accountType: "SALON_PARTNER" }).success,
    ).toBe(true);
    expect(
      onboardingDraftSchema.safeParse({
        accountType: "SALON_PARTNER",
        partnerCompletedAt: new Date(),
      }).success,
    ).toBe(false);
  });
  it("preserves booking and management destinations while rejecting external and auth loops", () => {
    expect(onboardingDestination("/salons/my-salon/book?service=123")).toBe(
      "/salons/my-salon/book?service=123",
    );
    expect(onboardingDestination("/admin/salons/verification")).toBe(
      "/admin/salons/verification",
    );
    for (const value of [
      "https://evil.test",
      "//evil.test",
      "/\\evil.test",
      "/login",
      "/onboarding",
      "/salons/create",
      "/salons/../../login",
      "/salons/a/manage",
    ])
      expect(onboardingDestination(value)).toBe("/salons");
  });
});
