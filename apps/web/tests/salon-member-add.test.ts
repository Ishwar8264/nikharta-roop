import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), limit: vi.fn(), salon: vi.fn(), add: vi.fn(), audit: vi.fn(), send: vi.fn(),
}));
vi.mock("../src/server/auth/session", () => ({ getAuthContext: mocks.auth }));
vi.mock("../src/lib/rate-limit", () => ({ salonMemberLimiter: { limit: mocks.limit }, rateLimitHeaders: () => ({ "Retry-After": "60" }) }));
vi.mock("../src/server/modules/salon/salon.repository", () => ({
  findSalonForViewer: mocks.salon, addSalonMember: mocks.add,
}));
vi.mock("../src/server/modules/audit/audit.writer", () => ({ writeAuditLog: mocks.audit }));
vi.mock("../src/server/modules/auth/onboarding.service", () => ({ requirePartnerOnboarding: vi.fn() }));

vi.mock("../src/server/modules/otp/otp.service", () => ({ sendOtp: mocks.send }));

import { OtpCooldownError, OtpDeliveryError } from "../src/server/modules/otp/otp.errors";
import { SalonMemberAccountUnavailableError } from "../src/server/modules/salon/salon.errors";
import { Prisma } from "@nikharta-roop/db/client";
import { POST } from "../src/app/api/v1/salons/[salonRef]/members/route";
import { addSalonMemberSchema } from "@nikharta-roop/shared/schemas/salon";

const salonId = "a".repeat(48);
const userId = "b".repeat(48);
function request(body: unknown = { name: "Staff Member", email: "staff@example.com", role: "STAFF" }, ref = salonId) {
  return POST(new Request("https://example.com/api/v1/salons/test/members", {
    method: "POST", body: JSON.stringify(body),
  }), { params: Promise.resolve({ salonRef: ref }) });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ sub: "owner" });
  mocks.limit.mockResolvedValue({ success: true });
  mocks.salon.mockResolvedValue({ id: salonId, viewerRole: "OWNER" });
  mocks.add.mockResolvedValue({ id: "membership", userId, salonId, role: "STAFF", user: { id: userId, email: "staff@example.com", emailVerified: true } });
});

describe("staff addition backend", () => {
  it("requires authentication before looking up accounts", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await request()).status).toBe(401);
    expect(mocks.add).not.toHaveBeenCalled();
  });
  for (const role of ["MANAGER", "STAFF"]) {
    it(`rejects a ${role} before account lookup`, async () => {
      mocks.salon.mockResolvedValue({ viewerRole: role });
      expect((await request()).status).toBe(403);
      expect(mocks.add).not.toHaveBeenCalled();
      expect(mocks.add).not.toHaveBeenCalled();
    });
  }
  it("hides missing salons, outsiders and deleted callers", async () => {
    mocks.salon.mockResolvedValue(null);
    expect((await request()).status).toBe(404);
    expect(mocks.add).not.toHaveBeenCalled();
  });
  it("returns an actionable error for ineligible accounts", async () => {
    mocks.add.mockRejectedValue(new SalonMemberAccountUnavailableError());
    expect((await request()).status).toBe(422);
  });
  it("normalizes email and audits the resolved account", async () => {
    expect((await request({ name: "Staff Member", email: " Staff@Example.com ", role: "STAFF" })).status).toBe(201);
    expect(mocks.add).toHaveBeenCalledWith({ actorId: "owner", salonId, email: "staff@example.com", name: "Staff Member", role: "STAFF" });
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ newData: { salonId, memberUserId: userId, role: "STAFF" } }));
  });
  it("keeps ID-based callers supported for allowed roles", async () => {
    expect((await request({ userId, role: "MANAGER" })).status).toBe(201);
    expect(mocks.add).toHaveBeenCalledWith({ actorId: "owner", userId, salonId, role: "MANAGER" });
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
  it("sends verification for pending accounts", async () => {
    mocks.add.mockResolvedValue({ id: "membership", userId, salonId, role: "STAFF", user: { id: userId, email: "staff@example.com", emailVerified: false } });
    const response = await request();
    expect(response.status).toBe(201);
    expect(mocks.send).toHaveBeenCalledWith({ email: "staff@example.com", staffActivation: true });
    expect(await response.json()).toMatchObject({ data: { member: { verificationEmailSent: true } } });
  });
  it("keeps the saved membership pending when email delivery fails", async () => {
    mocks.add.mockResolvedValue({ id: "membership", userId, salonId, role: "STAFF", user: { id: userId, email: "staff@example.com", emailVerified: false } });
    mocks.send.mockRejectedValue(new OtpDeliveryError());
    const response = await request();
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ data: { member: { verificationEmailSent: false } } });
  });
  it("treats an existing valid-code cooldown as pending delivery", async () => {
    mocks.add.mockResolvedValue({ id: "membership", userId, salonId, role: "STAFF", user: { id: userId, email: "staff@example.com", emailVerified: false } });
    mocks.send.mockRejectedValue(new OtpCooldownError(60));
    expect((await request()).status).toBe(201);
  });
  it("does not send redundant verification for verified accounts", async () => {
    await request();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("rate limits additions before lookups", async () => {
    mocks.limit.mockResolvedValue({ success: false });
    const response = await request();
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("60");
    expect(mocks.add).not.toHaveBeenCalled();
  });
  for (const body of [
    { email: "bad", role: "STAFF" }, { email: "staff@example.com", role: "OWNER" },
    { userId, role: "OWNER" }, { email: "staff@example.com", userId, role: "STAFF" },
    { email: "staff@example.com", role: "STAFF", salonId }, { role: "STAFF" },
  ]) {
    it(`rejects invalid input ${JSON.stringify(body)}`, async () => {
      expect((await request(body)).status).toBe(400);
      expect(mocks.add).not.toHaveBeenCalled();
    });
  }
  for (const change of [{ name: "A" }, { name: "a".repeat(101) }, { title: "a".repeat(101) }, { description: "a".repeat(501) }, { avatar: "not-a-url" }, { avatar: "javascript:alert(1)" }, { avatar: "http://example.com/photo.png" }]) {
    it(`validates profile input ${JSON.stringify(change)}`, async () => {
      expect((await request({ name: "Staff Member", email: "staff@example.com", role: "STAFF", ...change })).status).toBe(400);
      expect(mocks.add).not.toHaveBeenCalled();
    });
  }
  it("rejects invalid salon identifiers", async () => {
    expect((await request(undefined, "salon-slug")).status).toBe(400);
  });
  it("validates roles independently of UI controls", () => {
    expect(addSalonMemberSchema.safeParse({ userId, role: "SUPER_ADMIN" }).success).toBe(false);
  });
});
