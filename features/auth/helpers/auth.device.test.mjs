import assert from "node:assert/strict";
import test from "node:test";

import { getDeviceName } from "./auth.device.ts";

test("getDeviceName labels Chrome on macOS", () => {
  const userAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36";

  assert.equal(getDeviceName(userAgent), "Chrome on macOS");
});

test("getDeviceName labels Safari on iPhone", () => {
  const userAgent =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

  assert.equal(getDeviceName(userAgent), "Safari on iPhone");
});

test("getDeviceName returns null when user-agent is missing", () => {
  assert.equal(getDeviceName(null), null);
});
