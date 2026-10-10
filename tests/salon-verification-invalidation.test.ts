import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  lock: vi.fn(),
  current: vi.fn(),
  invalidate: vi.fn(),
  update: vi.fn(),
}));
vi.mock("../src/lib/prisma", () => ({
  prisma: {
    $transaction: (callback: (transaction: unknown) => unknown) =>
      callback({
        $queryRaw: mock.lock,
        salon: { findUnique: mock.current, update: mock.update },
        salonVerification: { updateMany: mock.invalidate },
      }),
  },
}));
import { updateSalonById } from "../src/server/modules/salon/salon.repository";
beforeEach(() => {
  vi.clearAllMocks();
  mock.current.mockResolvedValue({
    name: "Salon",
    address: "Old address",
    city: "Mumbai",
    state: "Maharashtra",
    zip: "400001",
    country: "IN",
    lat: 19,
    lng: 72,
    placeId: null,
  });
});
describe("verification invalidation", () => {
  it("hides the salon and clears reviewed proofs when business identity or location changes", async () => {
    await updateSalonById("salon", { address: "New address" });
    expect(mock.lock).toHaveBeenCalledOnce();
    expect(mock.invalidate).toHaveBeenCalledWith({
      where: { salonId: "salon", status: { not: "SUSPENDED" } },
      data: expect.objectContaining({
        status: "PENDING",
        submittedAt: null,
        reviewedBy: null,
      }),
    });
    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { address: "New address", isActive: false },
      }),
    );
  });
  it("preserves verification for unchanged identity values and normal content edits", async () => {
    await updateSalonById("salon", {
      name: "Salon",
      description: "Updated description",
    });
    expect(mock.invalidate).not.toHaveBeenCalled();
    expect(mock.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { name: "Salon", description: "Updated description" },
      }),
    );
  });
});
