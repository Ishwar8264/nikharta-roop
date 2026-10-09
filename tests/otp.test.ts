import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Pure unit tests for the OTP helpers in `src/server/auth/otp.ts`.
 *
 * The module's only runtime import is the `server-only` marker (stubbed in
 * `vitest.config.ts`); `hashOtp`/`verifyOtp` delegate to `password.ts`, which
 * uses `node:crypto` scrypt — no Prisma, no DB. So no `vi.mock` is needed.
 */
import {
  generateOtp,
  hashOtp,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_MINUTES,
  otpExpiryFromNow,
  verifyOtp,
} from "../src/server/auth/otp";

describe("OTP constants", () => {
  it("exports the documented TTL, cooldown, and attempt cap", () => {
    // These constants drive the OTP attempt/expiry flow in the service layer —
    // pinning them guards against an accidental bump that silently weakens
    // security (e.g. raising MAX_ATTEMPTS to 50, or shrinking TTL).
    expect(OTP_TTL_MINUTES).toBe(10);
    expect(OTP_RESEND_COOLDOWN_SECONDS).toBe(60);
    expect(OTP_MAX_ATTEMPTS).toBe(5);
  });
});

describe("generateOtp", () => {
  it("returns a 6-digit string", () => {
    const code = generateOtp();
    expect(typeof code).toBe("string");
    expect(code).toHaveLength(6);
  });

  it("contains only digits 0-9", () => {
    // Zero-padded numeric code — no letters, no symbols, no whitespace.
    const code = generateOtp();
    expect(code).toMatch(/^\d{6}$/);
  });

  it("returns different values across calls (non-deterministic)", () => {
    // `crypto.randomInt` is the source of entropy. With a 10^6 code space,
    // 50 draws should produce a wide spread of unique values — a stuck PRNG
    // or a hardcoded "default" code would fail this.
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      codes.add(generateOtp());
    }
    // 30 is a conservative threshold: the probability of fewer than 30 unique
    // codes out of 50 uniform draws from a 10^6 space is astronomically small.
    expect(codes.size).toBeGreaterThan(30);
  });

  it("preserves leading zeros via zero-padding", () => {
    // `padStart(6, "0")` turns a draw of 1234 into "001234". Drawing many
    // times and asserting at least one starts with "0" proves padding is
    // applied and not stripped. (~10% chance per draw, so 200 draws is
    // effectively guaranteed to hit at least one.)
    const codes: string[] = [];
    for (let i = 0; i < 200; i++) {
      codes.push(generateOtp());
    }
    expect(codes.some((c) => c.startsWith("0"))).toBe(true);
  });
});

describe("otpExpiryFromNow", () => {
  beforeEach(() => {
    // Defensive: a previous file's fake timers must not leak into these
    // real-clock assertions.
    vi.useRealTimers();
  });

  it("returns a Date roughly OTP_TTL_MINUTES in the future", () => {
    const before = Date.now();
    const expiry = otpExpiryFromNow();
    const after = Date.now();
    const ttlMs = OTP_TTL_MINUTES * 60 * 1000;
    // `otpExpiryFromNow` calls Date.now() once internally; that captured
    // instant lies in [before, after], so the expiry is in
    // [before + TTL, after + TTL] — a tight window with no extra tolerance.
    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + ttlMs);
    expect(expiry.getTime()).toBeLessThanOrEqual(after + ttlMs);
  });

  it("always returns a future date, never the past or now", () => {
    const before = Date.now();
    const expiry = otpExpiryFromNow();
    // An OTP that's already expired at issue time is useless. Strict >.
    expect(expiry.getTime()).toBeGreaterThan(before);
  });
});

describe("hashOtp / verifyOtp", () => {
  it("hashOtp returns a string different from the input code", async () => {
    const code = "123456";
    const hash = await hashOtp(code);
    expect(typeof hash).toBe("string");
    expect(hash).not.toBe(code);
    // The hash uses our self-describing scrypt format.
    expect(hash.startsWith("scrypt$")).toBe(true);
  });

  it("hashOtp is salted — same code produces different hashes", async () => {
    // `hashPassword` (and therefore `hashOtp`) generates a fresh random salt
    // per call, so two hashes of the same code must differ. This is what
    // stops an attacker with a DB dump from rainbow-table'ing identical OTPs
    // across users.
    const a = await hashOtp("999999");
    const b = await hashOtp("999999");
    expect(a).not.toBe(b);
  });

  it("verifyOtp returns true for a matching code/hash pair", async () => {
    const code = "482910";
    const hash = await hashOtp(code);
    expect(await verifyOtp(code, hash)).toBe(true);
  });

  it("verifyOtp returns false for a wrong code", async () => {
    const hash = await hashOtp("111111");
    expect(await verifyOtp("222222", hash)).toBe(false);
  });

  it("verifyOtp returns false for an empty code", async () => {
    const hash = await hashOtp("333333");
    expect(await verifyOtp("", hash)).toBe(false);
  });

  it("verifyOtp returns false (does not throw) for a malformed stored hash", async () => {
    // `verifyPassword` parses the stored hash into our
    // "scrypt$N=..,r=..,p=..$salt$hash" format; parse failure returns null
    // and verifyOtp short-circuits to false. Asserting this documents the
    // fail-closed contract — a corrupt DB row must not crash the verify path.
    expect(await verifyOtp("123456", "")).toBe(false);
    expect(await verifyOtp("123456", "not-a-real-hash")).toBe(false);
    expect(await verifyOtp("123456", "scrypt$malformed")).toBe(false);
  });
});
