import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ publicSalon: vi.fn(), session: vi.fn(), membership: vi.fn() }));
vi.mock("../src/server/modules/salon/salon.service", () => ({ getSalonSummaryBySlug: mocks.publicSalon }));
vi.mock("../src/server/modules/salon/salon.repository", () => ({ findSalonForViewer: mocks.membership }));
vi.mock("../src/lib/auth/get-session", () => ({ getSession: mocks.session }));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_NOT_FOUND"); } }));

import SalonLayout from "../src/app/(public)/salons/[slug]/layout";
import { SalonNotFoundError } from "../src/server/modules/salon/salon.errors";

const props = { params: Promise.resolve({ slug: "pending-salon" }), children: "Verification form" };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.publicSalon.mockRejectedValue(new SalonNotFoundError());
  mocks.session.mockResolvedValue({ id: "viewer-id" });
  mocks.membership.mockResolvedValue(null);
});

describe("salon parent layout access", () => {
  for (const role of ["OWNER", "MANAGER"] as const) {
    it(`renders pending salon onboarding for its ${role}`, async () => {
      mocks.membership.mockResolvedValue({ name: "Pending Salon", slug: "pending-salon", viewerRole: role });
      const result = await SalonLayout(props);
      expect(result.props.salon).toEqual({ name: "Pending Salon", slug: "pending-salon", canManage: true, isPublic: false });
      expect(result.props.children).toBe("Verification form");
      expect(mocks.membership).toHaveBeenCalledWith({ slug: "pending-salon", userId: "viewer-id" });
    });
  }

  it("does not expose inactive salons to non-members", async () => {
    await expect(SalonLayout(props)).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("does not expose inactive salons to staff through the onboarding shell", async () => {
    mocks.membership.mockResolvedValue({ name: "Pending Salon", slug: "pending-salon", viewerRole: "STAFF" });
    await expect(SalonLayout(props)).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("does not expose inactive salons to anonymous visitors", async () => {
    mocks.session.mockResolvedValue(null);
    await expect(SalonLayout(props)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.membership).not.toHaveBeenCalled();
  });

  it("preserves public navigation for active salons", async () => {
    mocks.publicSalon.mockResolvedValue({ name: "Active Salon", slug: "active-salon" });
    mocks.session.mockResolvedValue(null);
    const result = await SalonLayout(props);
    expect(result.props.salon.isPublic).toBe(true);
    expect(result.props.salon.canManage).toBe(false);
  });

  it("propagates unexpected read errors instead of returning a misleading 404", async () => {
    mocks.publicSalon.mockRejectedValue(new Error("Database unavailable"));
    await expect(SalonLayout(props)).rejects.toThrow("Database unavailable");
  });
});
