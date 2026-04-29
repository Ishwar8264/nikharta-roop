import assert from "node:assert/strict";
import test from "node:test";

import {
  generateAuthToken,
  generateOtp,
  hashAuthToken,
  hashOtp,
} from "./auth.crypto.ts";

test("generateOtp returns a six digit code", () => {
  const otp = generateOtp();

  assert.match(otp, /^\d{6}$/);
});

test("hashOtp is deterministic and does not expose the OTP", () => {
  const hash = hashOtp("9876543210", "123456", "test-secret");

  assert.equal(hash, hashOtp("9876543210", "123456", "test-secret"));
  assert.notEqual(hash, "123456");
  assert.match(hash, /^[a-f0-9]{64}$/);
});

test("session tokens are opaque and stored as hashes", () => {
  const token = generateAuthToken();
  const hash = hashAuthToken(token, "test-secret");

  assert.ok(token.length >= 40);
  assert.notEqual(hash, token);
  assert.equal(hash, hashAuthToken(token, "test-secret"));
  assert.match(hash, /^[a-f0-9]{64}$/);
});
