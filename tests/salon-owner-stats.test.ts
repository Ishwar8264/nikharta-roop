import { afterEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ owned: vi.fn(), appointments: vi.fn(), counts: vi.fn(), verification: vi.fn() }));
vi.mock("../src/server/modules/salon/salon.service", () => ({ findOwnedSalonSummary: mocks.owned }));
vi.mock("../src/server/modules/salon/salon.repository", () => ({ countSalonActiveCatalog: mocks.counts }));
vi.mock("../src/server/modules/appointment/appointment.service", () => ({ listAppointmentsForSalon: mocks.appointments }));
vi.mock("../src/server/modules/verification/verification.service", () => ({ getSalonVerification: mocks.verification }));
import { getSalonOwnerStats } from "../src/server/modules/salon/salon-stats.service";
afterEach(() => vi.resetAllMocks());
it("loads owner stats for a private salon using internal catalogue counts", async () => {
  mocks.owned.mockResolvedValue({ id: "s", slug: "private", name: "Private", city: "Delhi", timezone: "Asia/Kolkata", isActive: false });
  mocks.appointments.mockResolvedValue({ items: [] });
  mocks.counts.mockResolvedValue({ services: 150, packages: 120 });
  mocks.verification.mockResolvedValue({ status: "PENDING" });
  expect(await getSalonOwnerStats("owner")).toMatchObject({ activeServices: 150, activePackages: 120, pendingVerification: true });
  expect(mocks.counts).toHaveBeenCalledWith("s");
});
it("does not query private catalogue counts for a non-owner", async () => {
  mocks.owned.mockResolvedValue(null);
  expect(await getSalonOwnerStats("customer")).toBeNull();
  expect(mocks.counts).not.toHaveBeenCalled();
});
