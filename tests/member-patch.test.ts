import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), update: vi.fn() }));
vi.mock("../src/server/auth/session", () => ({ getAuthContext: mocks.auth }));
vi.mock("../src/lib/prisma", () => ({ prisma: { salonMember: { update: mocks.update } } }));
import { PATCH } from "../src/app/api/v1/salons/[salonRef]/members/[memberId]/route";
import { Prisma } from "../src/generated/prisma/client";
const salonId = "a".repeat(48), memberId = "b".repeat(48);
const context = () => ({ params: Promise.resolve({ salonRef: salonId, memberId }) });
const request = (body: unknown) => new Request("http://localhost/api/v1/salons/test/members/test", { method: "PATCH", body: JSON.stringify(body), headers: { "Content-Type": "application/json" } });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ sub: "self" });
  mocks.update.mockResolvedValue({ id: memberId, slug: "ishwar-sahani", name: "Ishwar Sahani" });
});
it("updates only the caller's membership and leaves omitted fields unchanged", async () => {
  const response = await PATCH(request({ slug: "ishwar-sahani", title: null }), context());
  expect(response.status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: memberId, salonId, userId: "self", user: { deletedAt: null, emailVerified: true }, salon: { deletedAt: null } },
    data: { slug: "ishwar-sahani", title: null },
  }));
  expect((await response.json()).data.member.slug).toBe("ishwar-sahani");
});
it("rejects unauthenticated updates", async () => {
  mocks.auth.mockResolvedValue(null);
  expect((await PATCH(request({ name: "Changed" }), context())).status).toBe(401);
  expect(mocks.update).not.toHaveBeenCalled();
});
it.each([{}, { role: "OWNER" }, { userId: "other" }, { emailVerified: true }, { email: "other@example.com" }, { slug: "create" }, { slug: "a".repeat(48) }, { slug: "Not Valid" }, { slug: null }, { name: "" }, { avatar: "http://example.com/avatar.png" }, { bannerImage: "http://example.com/banner.png" }, { bannerImage: "invalid" }, { bannerImage: "https://example.com/" + "x".repeat(2048) }])("rejects invalid or privileged fields: %j", async (body) => {
  expect((await PATCH(request(body), context())).status).toBe(400);
  expect(mocks.update).not.toHaveBeenCalled();
});
it("returns 404 when another user's membership or another salon is targeted", async () => {
  mocks.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Missing", { code: "P2025", clientVersion: "7.10.0" }));
  expect((await PATCH(request({ name: "Changed" }), context())).status).toBe(404);
});
it("returns 409 for a concurrent duplicate slug", async () => {
  mocks.update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("Duplicate", { code: "P2002", clientVersion: "7.10.0" }));
  expect((await PATCH(request({ slug: "taken-name" }), context())).status).toBe(409);
});
it("rejects malformed JSON", async () => {
  expect((await PATCH(new Request("http://localhost", { method: "PATCH", body: "{" }), context())).status).toBe(400);
  expect(mocks.update).not.toHaveBeenCalled();
});

it.each(["https://example.com/banner.png", null])("accepts a banner update or explicit removal: %s", async (bannerImage) => {
  expect((await PATCH(request({ bannerImage }), context())).status).toBe(200);
  expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: { bannerImage } }));
});
