import { beforeEach, describe, expect, it, vi } from "vitest";
import { PARTNER_TERMS_VERSION } from "../src/features/onboarding/policy";
const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  transaction: vi.fn(),
  salon: vi.fn(),
  member: vi.fn(),
  verification: vi.fn(),
}));
vi.mock("../src/lib/prisma", () => ({
  prisma: { user: { findFirst: mocks.user }, $transaction: mocks.transaction },
}));
vi.mock("../src/server/modules/audit/audit.writer", () => ({
  writeAuditLog: vi.fn(),
}));
import { createSalon } from "../src/server/modules/salon/salon.service";
import { createSalonSchema } from "../src/server/modules/salon/salon.schema";
import { PartnerOnboardingRequiredError } from "../src/server/modules/auth/onboarding.service";
const input = createSalonSchema.parse({
  name: "Example Salon",
  slug: "example-salon",
  address: "123 Main Street",
  city: "Delhi",
  state: "Delhi",
  zip: "110001",
  lat: 28.6,
  lng: 77.2,
});
beforeEach(() => {
  vi.resetAllMocks();
  mocks.salon.mockResolvedValue({ id: "new-salon", slug: "example-salon" });
  mocks.transaction.mockImplementation(async (fn) =>
    fn({
      salon: { create: mocks.salon },
      salonMember: { create: mocks.member },
      salonVerification: { create: mocks.verification },
    }),
  );
});
describe("salon creation enforces partner setup in the service", () => {
  it("rejects customer, incomplete partner and administrator before any salon write", async () => {
    for (const user of [
      { accountType: "CUSTOMER" },
      { accountType: "SALON_PARTNER" },
      { role: "SUPER_ADMIN" },
      null,
    ]) {
      mocks.user.mockResolvedValue(user);
      await expect(createSalon("user", input)).rejects.toBeInstanceOf(
        PartnerOnboardingRequiredError,
      );
    }
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("creates an inactive salon with OWNER membership and pending verification for an eligible partner", async () => {
    mocks.user.mockResolvedValue({
      partnerCompletedAt: new Date(),
      partnerTermsAcceptedAt: new Date(),
      partnerTermsVersion: PARTNER_TERMS_VERSION,
    });
    await createSalon("user", input);
    expect(mocks.salon.mock.calls[0][0].data.isActive).toBe(false);
    expect(mocks.member).toHaveBeenCalledWith({
      data: { userId: "user", salonId: "new-salon", role: "OWNER" },
    });
    expect(mocks.verification).toHaveBeenCalledWith({
      data: { salonId: "new-salon", status: "PENDING" },
    });
  });
});
