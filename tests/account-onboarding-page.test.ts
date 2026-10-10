import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn() }));
vi.mock("../src/lib/auth/get-session", () => ({ getSession: mocks.session }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(path);
  },
}));
vi.mock("../src/features/salon/components/form", () => ({
  SalonForm: () => null,
}));
import OnboardingPage from "../src/app/(public)/onboarding/page";
import CreateSalonPage from "../src/app/(public)/salons/create/page";
beforeEach(() => vi.resetAllMocks());
describe("optional onboarding page and protected creation page", () => {
  it("requires partner setup when the create URL is opened directly", async () => {
    mocks.session.mockResolvedValue({
      id: "customer",
      accountType: "CUSTOMER",
    });
    await expect(CreateSalonPage()).rejects.toThrow("/onboarding?type=partner");
  });
  it("keeps welcome onboarding optional for an incomplete customer", async () => {
    mocks.session.mockResolvedValue({ id: "user", accountType: null });
    const result = await OnboardingPage({
      searchParams: Promise.resolve({
        welcome: "1",
        redirect: "/salons/example/book",
      }),
    });
    expect(result.props.destination).toBe("/salons/example/book");
    expect(result.props.partnerRequested).toBe(false);
  });
  it("returns completed customers to their booking rather than asking again", async () => {
    mocks.session.mockResolvedValue({
      accountType: "CUSTOMER",
      onboardingCompletedAt: new Date(),
    });
    await expect(
      OnboardingPage({
        searchParams: Promise.resolve({
          welcome: "1",
          redirect: "/salons/example/book",
        }),
      }),
    ).rejects.toThrow("/salons/example/book");
  });
  it("allows an existing owner to create without repeating consent", async () => {
    mocks.session.mockResolvedValue({
      accountType: "SALON_PARTNER",
      partnerEligibilityBackfilledAt: new Date(),
      onboardingCompletedAt: new Date(),
    });
    await expect(CreateSalonPage()).resolves.toBeTruthy();
    await expect(
      OnboardingPage({ searchParams: Promise.resolve({ type: "partner" }) }),
    ).rejects.toThrow("/salons/create");
  });
});
