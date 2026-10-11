import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), limit: vi.fn(), salon: vi.fn(), account: vi.fn(), existing: vi.fn(), add: vi.fn(), audit: vi.fn(),
}));
vi.mock("../src/server/auth/session", () => ({ getAuthContext: mocks.auth }));
vi.mock("../src/lib/rate-limit", () => ({ salonMemberLimiter: { limit: mocks.limit }, rateLimitHeaders: () => ({ "Retry-After": "60" }) }));
vi.mock("../src/server/modules/salon/salon.repository", () => ({
  findSalonForViewer: mocks.salon, findEligibleSalonMemberAccount: mocks.account,
  findSalonMemberByUser: mocks.existing, addSalonMember: mocks.add,
}));
vi.mock("../src/server/modules/audit/audit.writer", () => ({ writeAuditLog: mocks.audit }));
vi.mock("../src/server/modules/auth/onboarding.service", () => ({ requirePartnerOnboarding: vi.fn() }));

import { Prisma } from "../src/generated/prisma/client";
import { POST } from "../src/app/api/v1/salons/[salonRef]/members/route";
import { addSalonMemberSchema } from "../src/server/modules/salon/salon.schema";

const salonId = "a".repeat(48);
const userId = "b".repeat(48);
function request(body: unknown = { email: "staff@example.com", role: "STAFF" }, ref = salonId) {
  return POST(new Request("https://example.com/api/v1/salons/test/members", {
    method: "POST", body: JSON.stringify(body),
  }), { params: Promise.resolve({ salonRef: ref }) });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ sub: "owner" });
  mocks.limit.mockResolvedValue({ success: true });
  mocks.salon.mockResolvedValue({ id: salonId, viewerRole: "OWNER" });
  mocks.account.mockResolvedValue({ id: userId });
  mocks.existing.mockResolvedValue(null);
  mocks.add.mockResolvedValue({ id: "membership", userId, salonId, role: "STAFF" });
});

describe("staff addition backend", () => {
  it("requires authentication before looking up accounts", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await request()).status).toBe(401);
    expect(mocks.account).not.toHaveBeenCalled();
  });
  for (const role of ["MANAGER", "STAFF"]) {
    it(`rejects a ${role} before account lookup`, async () => {
      mocks.salon.mockResolvedValue({ viewerRole: role });
      expect((await request()).status).toBe(403);
      expect(mocks.account).not.toHaveBeenCalled();
      expect(mocks.add).not.toHaveBeenCalled();
    });
  }
  it("hides missing salons, outsiders and deleted callers", async () => {
    mocks.salon.mockResolvedValue(null);
    expect((await request()).status).toBe(404);
    expect(mocks.account).not.toHaveBeenCalled();
  });
  it("rejects unavailable target accounts without attempting insertion", async () => {
    mocks.account.mockResolvedValue(null);
    expect((await request()).status).toBe(422);
    expect(mocks.add).not.toHaveBeenCalled();
  });
  it("normalizes email and audits the resolved account", async () => {
    expect((await request({ email: " Staff@Example.com ", role: "STAFF" })).status).toBe(201);
    expect(mocks.account).toHaveBeenCalledWith({ email: "staff@example.com", role: "STAFF" });
    expect(mocks.add).toHaveBeenCalledWith({ userId, salonId, role: "STAFF" });
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ newData: { salonId, memberUserId: userId, role: "STAFF" } }));
  });
  it("keeps ID-based callers supported for allowed roles", async () => {
    expect((await request({ userId, role: "MANAGER" })).status).toBe(201);
    expect(mocks.add).toHaveBeenCalledWith({ userId, salonId, role: "MANAGER" });
  });
  it("rejects duplicates", async () => {
    mocks.existing.mockResolvedValue({ id: "existing" });
    expect((await request()).status).toBe(409);
    expect(mocks.add).not.toHaveBeenCalled();
  });
  it("maps concurrent duplicate insertion to conflict", async () => {
    mocks.add.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "7", meta: { target: ["userId", "salonId"] } }));
    expect((await request()).status).toBe(409);
    expect(mocks.audit).not.toHaveBeenCalled();
  });
  it("maps a disappearing account to an actionable error", async () => {
    mocks.add.mockRejectedValue(new Prisma.PrismaClientKnownRequestError("foreign key", { code: "P2003", clientVersion: "7" }));
    expect((await request()).status).toBe(422);
  });
  it("rate limits additions before lookups", async () => {
    mocks.limit.mockResolvedValue({ success: false });
    const response = await request();
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(mocks.account).not.toHaveBeenCalled();
  });
  for (const body of [
    { email: "bad", role: "STAFF" }, { email: "staff@example.com", role: "OWNER" },
    { userId, role: "OWNER" }, { email: "staff@example.com", userId, role: "STAFF" },
    { email: "staff@example.com", role: "STAFF", salonId }, { role: "STAFF" },
  ]) {
    it(`rejects invalid input ${JSON.stringify(body)}`, async () => {
      expect((await request(body)).status).toBe(400);
      expect(mocks.account).not.toHaveBeenCalled();
    });
  }
  it("rejects invalid salon identifiers", async () => {
    expect((await request(undefined, "salon-slug")).status).toBe(400);
  });
  it("validates roles independently of UI controls", () => {
    expect(addSalonMemberSchema.safeParse({ userId, role: "SUPER_ADMIN" }).success).toBe(false);
  });
});
