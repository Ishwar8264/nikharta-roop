import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ user: { findFirst: vi.fn() }, salon: { findFirst: vi.fn() } }));
vi.mock("../src/lib/prisma", () => ({ prisma: mocks }));
import { findEligibleSalonMemberAccount, findSalonForViewer } from "../src/server/modules/salon/salon.repository";

beforeEach(() => vi.resetAllMocks());

it("excludes soft-deleted targets and selects only their ID", async () => {
  await findEligibleSalonMemberAccount({ email: "staff@example.com" });
  expect(mocks.user.findFirst).toHaveBeenCalledWith({
    where: { email: { equals: "staff@example.com", mode: "insensitive" }, deletedAt: null },
    select: { id: true },
  });
});
it("applies the same eligibility rule to ID-based additions", async () => {
  await findEligibleSalonMemberAccount({ userId: "staff" });
  expect(mocks.user.findFirst).toHaveBeenCalledWith({ where: { id: "staff", deletedAt: null }, select: { id: true } });
});
it("excludes deleted salons and deleted callers from owner authorization", async () => {
  mocks.salon.findFirst.mockResolvedValue({ id: "salon", members: [] });
  expect(await findSalonForViewer({ salonId: "salon", userId: "owner" })).toBeNull();
  expect(mocks.salon.findFirst).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: "salon", deletedAt: null },
    select: expect.objectContaining({ members: { where: { userId: "owner", user: { deletedAt: null } }, select: { role: true }, take: 1 } }),
  }));
});
