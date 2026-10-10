import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  complete: vi.fn(),
  draft: vi.fn(),
  create: vi.fn(),
}));
vi.mock("../src/server/auth/session", () => ({ getAuthContext: mocks.auth }));
vi.mock("../src/server/modules/auth/onboarding.service", async (original) => ({
  ...(await original<object>()),
  completeOnboarding: mocks.complete,
  saveOnboardingIntent: mocks.draft,
}));
vi.mock("../src/lib/prisma", () => ({ prisma: {} }));
vi.mock("../src/server/modules/salon/salon.service", () => ({
  createSalon: mocks.create,
  listSalons: vi.fn(),
}));
import { POST, PATCH } from "../src/app/api/v1/auth/onboarding/route";
import { POST as create } from "../src/app/api/v1/salons/route";
import { PartnerOnboardingRequiredError } from "../src/server/modules/auth/onboarding.service";

function request(body: unknown) {
  return new Request("https://example.test/api/v1/auth/onboarding", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ sub: "current-user" });
});

describe("onboarding API", () => {
  it("requires authentication for both completion and draft writes", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await POST(request({}))).status).toBe(401);
    expect((await PATCH(request({}))).status).toBe(401);
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("rejects attempts to update another user or grant privileges", async () => {
    for (const change of [
      { userId: "victim" },
      { role: "SUPER_ADMIN" },
      { partnerCompletedAt: new Date() },
    ]) {
      expect(
        (
          await POST(
            request({ accountType: "CUSTOMER", name: "Customer", ...change }),
          )
        ).status,
      ).toBe(400);
    }
    expect(mocks.complete).not.toHaveBeenCalled();
  });
  it("uses the authenticated subject for completion and intent", async () => {
    expect(
      (await POST(request({ accountType: "CUSTOMER", name: "Customer" })))
        .status,
    ).toBe(200);
    expect(mocks.complete).toHaveBeenCalledWith("current-user", {
      accountType: "CUSTOMER",
      name: "Customer",
    });
    expect(
      (await PATCH(request({ accountType: "SALON_PARTNER" }))).status,
    ).toBe(200);
    expect(mocks.draft).toHaveBeenCalledWith("current-user", {
      accountType: "SALON_PARTNER",
    });
  });
  it("returns a machine-readable response for direct API creation without onboarding", async () => {
    mocks.create.mockRejectedValue(new PartnerOnboardingRequiredError());
    const response = await create(
      request({
        name: "Example Salon",
        address: "123 Main Street",
        city: "Delhi",
        state: "Delhi",
        zip: "110001",
        lat: 28.6,
        lng: 77.2,
      }),
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: "PARTNER_ONBOARDING_REQUIRED",
      onboardingUrl: "/onboarding?type=partner",
    });
  });
});
