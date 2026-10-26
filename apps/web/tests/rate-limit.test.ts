import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.useRealTimers();
  vi.resetModules();
});

describe("local rate limiting", () => {
  it("initializes without Redis, enforces the auth limit, and resets after the window", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    vi.useFakeTimers();
    vi.resetModules();

    const { authLimiter } = await import("../src/lib/rate-limit");

    for (let request = 0; request < 10; request += 1) {
      expect((await authLimiter.limit("local-client")).success).toBe(true);
    }
    expect(await authLimiter.limit("local-client")).toMatchObject({
      success: false,
      remaining: 0,
    });
    expect((await authLimiter.limit("other-client")).success).toBe(true);

    vi.advanceTimersByTime(60_000);
    expect(await authLimiter.limit("local-client")).toMatchObject({
      success: true,
      remaining: 9,
    });
  });
});
