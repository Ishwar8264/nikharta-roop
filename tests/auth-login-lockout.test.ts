import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ redis: undefined as undefined | { eval: ReturnType<typeof vi.fn>; del: ReturnType<typeof vi.fn> } }));
vi.mock("../src/lib/rate-limit", () => mocks);
import { clearLockout, lockoutRetryAfterSeconds, recordFailedAttempt } from "../src/server/auth/login-lockout";

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-13T10:00:00Z")); mocks.redis = undefined; });
afterEach(() => { vi.useRealTimers(); });

describe("identifier lockout", () => {
  it("locks at five failures, normalizes keys, emits one transition and does not extend", async () => {
    const email = "threshold@example.com";
    await clearLockout(email);
    for (let i = 0; i < 4; i++) expect(await recordFailedAttempt(email)).toBe(false);
    expect(await lockoutRetryAfterSeconds(email)).toBe(0);
    expect(await recordFailedAttempt(" THRESHOLD@example.com ")).toBe(true);
    expect(await lockoutRetryAfterSeconds(email)).toBe(900);
    vi.advanceTimersByTime(1_000);
    expect(await recordFailedAttempt(email)).toBe(false);
    expect(await lockoutRetryAfterSeconds(email)).toBe(899);
    vi.advanceTimersByTime(899_000);
    expect(await lockoutRetryAfterSeconds(email)).toBe(0);
    expect(await recordFailedAttempt(email)).toBe(false);
  });
  it("expires partial counters and clears on successful authentication", async () => {
    const email = "expiry@example.com";
    for (let i = 0; i < 4; i++) await recordFailedAttempt(email);
    vi.advanceTimersByTime(900_000);
    expect(await recordFailedAttempt(email)).toBe(false);
    await clearLockout(email);
    for (let i = 0; i < 4; i++) expect(await recordFailedAttempt(email)).toBe(false);
  });
  it("uses atomic Redis scripts and hashed identifiers when configured", async () => {
    mocks.redis = { eval: vi.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(1_001), del: vi.fn() };
    expect(await recordFailedAttempt("redis@example.com")).toBe(true);
    expect(await lockoutRetryAfterSeconds(" REDIS@example.com ")).toBe(2);
    const key = mocks.redis.eval.mock.calls[0][1][0];
    expect(key).toMatch(/^auth:login-lockout:[a-f0-9]{64}$/);
    expect(mocks.redis.eval.mock.calls[1][1][0]).toBe(key);
    await clearLockout("redis@example.com");
    expect(mocks.redis.del).toHaveBeenCalledWith(key);
  });
  it("propagates Redis outages instead of bypassing production lockout", async () => {
    mocks.redis = { eval: vi.fn().mockRejectedValue(new Error("Redis unavailable")), del: vi.fn() };
    await expect(lockoutRetryAfterSeconds("outage@example.com")).rejects.toThrow("Redis unavailable");
    await expect(recordFailedAttempt("outage@example.com")).rejects.toThrow("Redis unavailable");
  });
});
