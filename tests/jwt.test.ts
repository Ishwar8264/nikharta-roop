import { afterAll, afterEach, describe, expect, it, vi } from "vitest";

/**
 * Pure unit tests for the JWT helpers in `src/server/auth/jwt.ts`.
 *
 * jwt.ts reads `process.env.JWT_SECRET` at module load and throws if missing
 * or shorter than 32 bytes. `vi.hoisted` runs its callback before any other
 * import in this file is evaluated, so we can safely stub the env before the
 * static `import { signAccessToken, ... }` below triggers jwt.ts evaluation.
 *
 * The callback also returns the secret so the rest of the file (which needs
 * to forge tokens with the *same* secret for issuer/audience/role tests)
 * can reference it without a temporal-dead-zone violation — anything declared
 * at module scope would not yet be initialized when the hoisted callback runs.
 *
 * `jose` is imported directly to forge "adversarial" tokens (wrong secret,
 * wrong issuer/audience, disallowed role) without env-juggling and re-imports.
 */
const TEST_SECRET = vi.hoisted(() => {
  const secret = "test-secret-at-least-32-bytes-long-for-hs256";
  vi.stubEnv("JWT_SECRET", secret);
  return secret;
});

import { SignJWT } from "jose";

import { signAccessToken, verifyAccessToken } from "../src/server/auth/jwt";

afterAll(() => {
  vi.unstubAllEnvs();
});

afterEach(() => {
  // Any test that activates fake timers must leave them restored so the next
  // case starts from real time.
  vi.useRealTimers();
});

const VALID_PAYLOAD = { sub: "user-abc-123", role: "USER" as const };

describe("signAccessToken", () => {
  it("returns a JWT string with three dot-separated segments", async () => {
    const token = await signAccessToken(VALID_PAYLOAD);
    expect(typeof token).toBe("string");
    // A compact JWS is header.payload.signature — exactly two dots.
    expect(token.split(".")).toHaveLength(3);
  });

  it("encodes the subject and role into the payload", async () => {
    // Sanity check: the payload base64-decodes to a JSON object whose `sub`
    // and `role` match what we passed in. This is the precondition for the
    // round-trip test below.
    const token = await signAccessToken(VALID_PAYLOAD);
    const payloadB64 = token.split(".")[1];
    const decoded = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    );
    expect(decoded.sub).toBe(VALID_PAYLOAD.sub);
    expect(decoded.role).toBe(VALID_PAYLOAD.role);
  });
});

describe("verifyAccessToken", () => {
  it("round-trips the payload through sign → verify", async () => {
    const token = await signAccessToken(VALID_PAYLOAD);
    const decoded = await verifyAccessToken(token);
    expect(decoded).toEqual(VALID_PAYLOAD);
  });

  it("rejects a tampered token (signature no longer matches)", async () => {
    const token = await signAccessToken({ sub: "user-1", role: "USER" });
    const [header, payloadB64, signature] = token.split(".");
    // Decode payload, attempt a privilege-escalation (role: USER → SUPER_ADMIN),
    // re-encode, keep the old signature. The signature was computed over the
    // original payload, so verification must fail.
    const payloadJson = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    );
    payloadJson.role = "SUPER_ADMIN";
    const tamperedPayload = Buffer.from(
      JSON.stringify(payloadJson),
      "utf8",
    ).toString("base64url");
    const tampered = [header, tamperedPayload, signature].join(".");
    await expect(verifyAccessToken(tampered)).rejects.toThrow();
  });

  it("rejects a token signed with a different secret", async () => {
    // Sign directly with jose using a different secret — bypasses our module
    // so we don't have to env-juggle and re-import.
    const wrongSecret = new TextEncoder().encode(
      "a-different-secret-also-at-least-32-bytes-long-xxx",
    );
    const token = await new SignJWT({ role: "USER" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setIssuer("salon-app")
      .setAudience("salon-app-client")
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(wrongSecret);
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it("rejects an expired token", async () => {
    // ACCESS_TOKEN_TTL is hardcoded to "15m" inside jwt.ts — there's no
    // override parameter, so we freeze the clock at issue time and then
    // advance past the TTL to force expiry. `jose` reads `Date.now()` for
    // both `setExpirationTime` (at sign) and the `exp` check (at verify),
    // so faking the clock is sufficient.
    vi.useFakeTimers({ now: new Date("2025-01-01T00:00:00Z") });
    const token = await signAccessToken({ sub: "user-1", role: "USER" });
    // 16 minutes — one minute past the 15-minute TTL.
    vi.advanceTimersByTime(16 * 60 * 1000);
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it("rejects a token with the wrong issuer", async () => {
    // The impl pins `issuer: "salon-app"` in jwtVerify; a token from any
    // other issuer must be rejected even if its signature is otherwise valid.
    const token = await new SignJWT({ role: "USER" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setIssuer("wrong-issuer")
      .setAudience("salon-app-client")
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode(TEST_SECRET));
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it("rejects a token with the wrong audience", async () => {
    const token = await new SignJWT({ role: "USER" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setIssuer("salon-app")
      .setAudience("wrong-audience")
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode(TEST_SECRET));
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it("rejects a token whose role is not in the allow-list", async () => {
    // The impl validates `role` ∈ {SUPER_ADMIN, USER}. Even though the
    // signature is valid, the role check inside verifyAccessToken must throw
    // — this is the second line of defense against a forged-but-signed token
    // carrying an attacker-chosen role.
    const token = await new SignJWT({ role: "ADMIN" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("user-1")
      .setIssuer("salon-app")
      .setAudience("salon-app-client")
      .setIssuedAt()
      .setExpirationTime("15m")
      .sign(new TextEncoder().encode(TEST_SECRET));
    await expect(verifyAccessToken(token)).rejects.toThrow();
  });

  it("rejects a completely malformed token string", async () => {
    // Not a JWT at all — verifyAccessToken must throw rather than return
    // undefined. Guards the "fail loud, don't silently authenticate" rule.
    await expect(verifyAccessToken("not.a.jwt")).rejects.toThrow();
    await expect(verifyAccessToken("")).rejects.toThrow();
  });
});
