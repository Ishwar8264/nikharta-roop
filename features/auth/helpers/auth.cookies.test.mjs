import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuthCookieHeaders,
  createClearAuthCookieHeaders,
  getCookieValue,
  headersWithSetCookies,
} from "./auth.cookies.ts";

test("createAuthCookieHeaders creates HttpOnly auth cookies", () => {
  const expiresAt = new Date("2030-01-01T00:00:00.000Z");
  const cookies = createAuthCookieHeaders({
    refreshToken: "refresh-token",
    refreshTokenExpiresAt: expiresAt,
    sessionToken: "session-token",
    sessionTokenExpiresAt: expiresAt,
  });

  assert.equal(cookies.length, 2);
  assert.ok(cookies.some((cookie) => cookie.startsWith("nr_session=")));
  assert.ok(cookies.some((cookie) => cookie.startsWith("nr_refresh=")));

  for (const cookie of cookies) {
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Path=\//);
    assert.match(cookie, /Expires=Tue, 01 Jan 2030 00:00:00 GMT/);
  }
});

test("createClearAuthCookieHeaders expires both auth cookies", () => {
  const cookies = createClearAuthCookieHeaders();

  assert.equal(cookies.length, 2);

  for (const cookie of cookies) {
    assert.match(cookie, /Max-Age=0/);
    assert.match(cookie, /Expires=Thu, 01 Jan 1970 00:00:00 GMT/);
  }
});

test("getCookieValue reads encoded cookie values", () => {
  const request = new Request("https://example.test", {
    headers: {
      cookie: "theme=dark; nr_session=session%20token; nr_refresh=abc",
    },
  });

  assert.equal(getCookieValue(request, "nr_session"), "session token");
  assert.equal(getCookieValue(request, "missing"), null);
});

test("headersWithSetCookies preserves multiple Set-Cookie headers", () => {
  const headers = headersWithSetCookies(["a=1; HttpOnly", "b=2; HttpOnly"]);

  assert.equal(headers.getSetCookie().length, 2);
});
