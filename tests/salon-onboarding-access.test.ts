import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("../src/lib/prisma", () => ({ prisma: { salon: { findFirst: mocks.findFirst } } }));

import { findSalonForViewer } from "../src/server/modules/salon/salon.repository";
import { getSalonBySlug, getSalonForServiceManagement } from "../src/server/modules/salon/salon.service";
import { SalonNotFoundError, SalonRoleInsufficientError } from "../src/server/modules/salon/salon.errors";

beforeEach(() => vi.resetAllMocks());

describe("pending salon onboarding access", () => {
  for (const role of ["OWNER", "MANAGER"] as const) {
    it(`allows the ${role} to manage an inactive salon by slug`, async () => {
      mocks.findFirst.mockResolvedValue({ id: "salon-id", slug: "pending-salon", members: [{ role }] });
      const salon = await getSalonForServiceManagement("pending-salon", "viewer-id");
      expect(salon.viewerRole).toBe(role);
      const query = mocks.findFirst.mock.calls[0][0];
      expect(query.where).toEqual({ slug: "pending-salon", deletedAt: null });
      expect(query.select.members.where).toEqual({ userId: "viewer-id" });
      expect(mocks.findFirst).toHaveBeenCalledTimes(1);
    });
  }

  it("rejects a viewer who is not a salon member", async () => {
    mocks.findFirst.mockResolvedValue({ id: "salon-id", members: [] });
    await expect(getSalonForServiceManagement("pending-salon", "outsider-id")).rejects.toBeInstanceOf(SalonNotFoundError);
  });

  it("rejects staff from the owner/manager onboarding page", async () => {
    mocks.findFirst.mockResolvedValue({ id: "salon-id", members: [{ role: "STAFF" }] });
    await expect(getSalonForServiceManagement("pending-salon", "staff-id")).rejects.toBeInstanceOf(SalonRoleInsufficientError);
  });

  it("rejects missing or soft-deleted salons", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(getSalonForServiceManagement("deleted-salon", "owner-id")).rejects.toBeInstanceOf(SalonNotFoundError);
    expect(mocks.findFirst.mock.calls[0][0].where.deletedAt).toBeNull();
  });

  it("keeps inactive salons unavailable on the public detail page", async () => {
    mocks.findFirst.mockResolvedValue(null);
    await expect(getSalonBySlug("pending-salon")).rejects.toBeInstanceOf(SalonNotFoundError);
    expect(mocks.findFirst.mock.calls[0][0].where).toEqual({ slug: "pending-salon", deletedAt: null, isActive: true });
  });

  it("preserves existing membership lookups by salon ID", async () => {
    mocks.findFirst.mockResolvedValue({ id: "salon-id", members: [{ role: "OWNER" }] });
    await findSalonForViewer({ salonId: "salon-id", userId: "owner-id" });
    expect(mocks.findFirst.mock.calls[0][0].where).toEqual({ id: "salon-id", deletedAt: null });
  });
});
