import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ salon: { findFirst: vi.fn(), findMany: vi.fn().mockResolvedValue([]) } }));
vi.mock("../src/lib/prisma", () => ({ prisma: { salon: mocks.salon } }));
import { findSalonBySlug, findSalonDetailBySlug, listActiveSalons } from "../src/server/modules/salon/salon.repository";
import { resolveSalonId } from "../src/server/modules/service/service.repository";
import { getActiveSalonTimezone } from "../src/server/modules/appointment/appointment.repository";
import { updateSalonSchema } from "@nikharta-roop/shared/schemas/salon";
import { BOOKABLE_SALON_FILTER, PUBLIC_SALON_FILTER } from "@nikharta-roop/shared/constants/salon-status";

beforeEach(() => vi.clearAllMocks());

describe("salon publication gates", () => {
  it("allows public browsing only for live and temporarily closed approved salons", async () => {
    for (const lookup of [findSalonBySlug, findSalonDetailBySlug]) {
      await lookup("salon");
      expect(mocks.salon.findFirst).toHaveBeenLastCalledWith(expect.objectContaining({ where: { slug: "salon", ...PUBLIC_SALON_FILTER } }));
    }
    await listActiveSalons({ limit: 10 });
    expect(mocks.salon.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: PUBLIC_SALON_FILTER }));
    await resolveSalonId("salon", true);
    expect(mocks.salon.findFirst).toHaveBeenLastCalledWith(expect.objectContaining({ where: { ...PUBLIC_SALON_FILTER, OR: [{ id: "salon" }, { slug: "salon" }] } }));
  });
  it("requires live for new bookings and availability while retaining management access", async () => {
    await resolveSalonId("salon", true, true);
    expect(mocks.salon.findFirst).toHaveBeenLastCalledWith(expect.objectContaining({ where: { ...BOOKABLE_SALON_FILTER, OR: [{ id: "salon" }, { slug: "salon" }] } }));
    await getActiveSalonTimezone("salon");
    expect(mocks.salon.findFirst).toHaveBeenLastCalledWith({ where: { id: "salon", ...BOOKABLE_SALON_FILTER }, select: { timezone: true } });
    await resolveSalonId("salon");
    expect(mocks.salon.findFirst).toHaveBeenLastCalledWith(expect.objectContaining({ where: { deletedAt: null, OR: [{ id: "salon" }, { slug: "salon" }] } }));
  });
  it("accepts salon lifecycle values without letting clients set verification", () => {
    for (const status of ["DRAFT", "LIVE", "TEMPORARILY_CLOSED", "ARCHIVED"] as const) expect(updateSalonSchema.parse({ status })).toEqual({ status });
    expect(updateSalonSchema.parse({ description: "Updated" })).toEqual({ description: "Updated" });
    expect(updateSalonSchema.safeParse({ status: "PUBLISHED" }).success).toBe(false);
    expect(updateSalonSchema.safeParse({ isActive: true }).success).toBe(false);
  });
});
