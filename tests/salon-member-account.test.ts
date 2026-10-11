import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: { upsert: vi.fn(), findUnique: vi.fn() }, salon: { findFirst: vi.fn() }, salonMember: { findFirst: vi.fn(), create: vi.fn() }, $transaction: vi.fn() }));
vi.mock("../src/lib/prisma", () => ({ prisma: mocks }));
import { addSalonMember, findSalonForViewer } from "../src/server/modules/salon/salon.repository";
import { SalonMemberAccountUnavailableError, SalonRoleInsufficientError } from "../src/server/modules/salon/salon.errors";
import { Prisma } from "../src/generated/prisma/client";
const input = { actorId: "owner", salonId: "salon", email: "staff@example.com", name: "Stylist", role: "STAFF" as const, avatar: "https://example.com/avatar.png", title: "Stylist", description: "Hair specialist" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.$transaction.mockImplementation((callback) => callback(mocks));
  mocks.salonMember.findFirst.mockResolvedValue({ role: "OWNER" });
  mocks.user.upsert.mockResolvedValue({ id: "staff", deletedAt: null });
  mocks.salonMember.create.mockResolvedValue({ id: "member" });
});
it("creates an unverified account and salon-specific profile atomically", async () => {
  await addSalonMember(input);
  expect(mocks.user.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { email: input.email }, create: { email: input.email, name: input.name, emailVerified: false }, update: {} }));
  expect(mocks.salonMember.create).toHaveBeenCalledWith(expect.objectContaining({ data: { salonId: "salon", userId: "staff", role: "STAFF", name: "Stylist", avatar: input.avatar, title: input.title, description: input.description } }));
  expect(mocks.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
});
it("preserves existing personal profiles through an empty upsert update", async () => {
  await addSalonMember(input);
  expect(mocks.user.upsert.mock.calls[0][0].update).toEqual({});
});
it("rejects deleted targets", async () => {
  mocks.user.upsert.mockResolvedValue({ id: "staff", deletedAt: new Date() });
  await expect(addSalonMember(input)).rejects.toBeInstanceOf(SalonMemberAccountUnavailableError);
  expect(mocks.salonMember.create).not.toHaveBeenCalled();
});
it("rejects missing ID-based targets", async () => {
  mocks.user.findUnique.mockResolvedValue(null);
  await expect(addSalonMember({ actorId: "owner", salonId: "salon", userId: "missing", role: "STAFF" })).rejects.toBeInstanceOf(SalonMemberAccountUnavailableError);
});
it("rechecks permissions inside the write transaction", async () => {
  mocks.salonMember.findFirst.mockResolvedValue({ role: "MANAGER" });
  await expect(addSalonMember(input)).rejects.toBeInstanceOf(SalonRoleInsufficientError);
  expect(mocks.user.upsert).not.toHaveBeenCalled();
});
it("retries serialization conflicts", async () => {
  mocks.$transaction.mockRejectedValueOnce(new Prisma.PrismaClientKnownRequestError("conflict", { code: "P2034", clientVersion: "7" }));
  await addSalonMember(input);
  expect(mocks.$transaction).toHaveBeenCalledTimes(2);
});
it("excludes deleted salons and unverified callers from authorization", async () => {
  mocks.salon.findFirst.mockResolvedValue({ id: "salon", members: [] });
  expect(await findSalonForViewer({ salonId: "salon", userId: "owner" })).toBeNull();
  expect(mocks.salon.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: "salon", deletedAt: null }, select: expect.objectContaining({ members: { where: { userId: "owner", user: { deletedAt: null, emailVerified: true } }, select: { role: true }, take: 1 } }) }));
});
