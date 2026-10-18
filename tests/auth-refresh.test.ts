import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  find: vi.fn(), claim: vi.fn(), create: vi.fn(), user: vi.fn(), sign: vi.fn(), transaction: vi.fn(),
}));
vi.mock("../src/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("../src/server/auth/jwt", () => ({ signAccessToken: mocks.sign }));
import { hashRefreshToken, rotateRefreshToken } from "../src/server/auth/token.service";
import { POST } from "../src/app/api/v1/auth/refresh/route";

const now = new Date("2026-10-13T10:00:00Z");
const original = {
  id: "original", userId: "user", tokenHash: hashRefreshToken("original-token"),
  expiresAt: new Date(now.getTime() + 60_000), revokedAt: null as Date | null,
};
type Row = typeof original;
let rows: Map<string, Row>;
let loseClaim: boolean;

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.stubEnv("JWT_SECRET", "test-secret-with-at-least-32-bytes-long");
  rows = new Map([[original.tokenHash, { ...original }]]);
  loseClaim = false;
  mocks.sign.mockResolvedValue("access-token");
  mocks.user.mockResolvedValue({ role: "USER", deletedAt: null });
  mocks.find.mockImplementation(async ({ where }: { where: { tokenHash: string } }) => {
    const row = rows.get(where.tokenHash);
    return row ? { ...row } : null;
  });
  mocks.create.mockImplementation(async ({ data }: { data: Omit<Row, "id" | "revokedAt"> }) => {
    rows.set(data.tokenHash, { ...data, id: "successor", revokedAt: null });
  });
  mocks.claim.mockImplementation(async ({ where }: { where: { id?: string; userId?: string } }) => {
    if (where.id) {
      rows.get(original.tokenHash)!.revokedAt = new Date();
      return { count: loseClaim ? 0 : 1 };
    }
    for (const row of rows.values()) row.revokedAt = new Date();
    return { count: rows.size };
  });
  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
    refreshToken: { findUnique: mocks.find, updateMany: mocks.claim, create: mocks.create },
    user: { findUnique: mocks.user },
  }));
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe("refresh retry recovery", () => {
  it("recovers the same successor and expiry after a lost response without another row", async () => {
    const first = await rotateRefreshToken("original-token");
    vi.advanceTimersByTime(9_000);
    const retry = await rotateRefreshToken("original-token");
    expect(retry?.refreshToken).toBe(first?.refreshToken);
    expect(retry?.refreshTokenExpiresAt).toEqual(first?.refreshTokenExpiresAt);
    expect(mocks.create).toHaveBeenCalledOnce();
    expect(mocks.create.mock.calls[0][0].data.tokenHash).toBe(hashRefreshToken(first!.refreshToken));
    expect(mocks.create.mock.calls[0][0].data).not.toHaveProperty("refreshToken");
  });

  it("supports retries at the boundary without extending the grace window", async () => {
    await rotateRefreshToken("original-token");
    vi.advanceTimersByTime(10_000);
    expect(await rotateRefreshToken("original-token")).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(await rotateRefreshToken("original-token")).toBeNull();
    expect([...rows.values()].every((row) => row.revokedAt)).toBe(true);
  });

  it("re-reads the winner after losing the conditional database claim", async () => {
    const first = await rotateRefreshToken("original-token");
    rows.get(original.tokenHash)!.revokedAt = null; // simulate pre-claim snapshot
    loseClaim = true;
    expect((await rotateRefreshToken("original-token"))?.refreshToken).toBe(first?.refreshToken);
    expect(rows.get(hashRefreshToken(first!.refreshToken))!.revokedAt).toBeNull();
    expect(mocks.create).toHaveBeenCalledOnce();
  });

  it("never recovers an unrelated session after logout", async () => {
    rows.get(original.tokenHash)!.revokedAt = now;
    rows.set("other", { ...original, id: "other", tokenHash: "other" });
    expect(await rotateRefreshToken("original-token")).toBeNull();
    expect(mocks.create).not.toHaveBeenCalled();
    expect(rows.get("other")!.revokedAt).toBeNull();
  });

  it.each(["revoked", "expired"])("rejects a %s successor", async (condition) => {
    const first = await rotateRefreshToken("original-token");
    const row = rows.get(hashRefreshToken(first!.refreshToken))!;
    if (condition === "revoked") row.revokedAt = now;
    else row.expiresAt = now;
    expect(await rotateRefreshToken("original-token")).toBeNull();
  });

  it("rejects deleted accounts and uses the current role for valid recovery", async () => {
    await rotateRefreshToken("original-token");
    mocks.user.mockResolvedValue({ role: "SUPER_ADMIN", deletedAt: null });
    await rotateRefreshToken("original-token");
    expect(mocks.sign).toHaveBeenLastCalledWith({ sub: "user", role: "SUPER_ADMIN" });
    mocks.user.mockResolvedValue({ role: "USER", deletedAt: now });
    expect(await rotateRefreshToken("original-token")).toBeNull();
  });

  it("rejects missing or expired input tokens without issuing credentials", async () => {
    expect(await rotateRefreshToken("unknown-token")).toBeNull();
    rows.get(original.tokenHash)!.expiresAt = now;
    expect(await rotateRefreshToken("original-token")).toBeNull();
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("returns 200 and successor cookies on an HTTP retry", async () => {
    const first = await rotateRefreshToken("original-token");
    const response = await POST(new Request("http://localhost/api/v1/auth/refresh", {
      method: "POST", headers: { cookie: "refreshToken=original-token" },
    }));
    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain(`refreshToken=${first!.refreshToken}`);
    expect(response.headers.get("set-cookie")).not.toContain("Max-Age=0");
  });
});
