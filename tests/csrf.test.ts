import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { isMutationRequestTrusted } from "../src/server/auth/csrf";

afterEach(() => vi.unstubAllEnvs());

function actionRequest(path = "/profile", overrides: Record<string, string> = {}, method = "POST") {
  vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  return new NextRequest(`http://localhost:3000${path}`, {
    method,
    headers: {
      origin: "http://localhost:3000",
      "sec-fetch-site": "same-origin",
      "next-action": "upload-action",
      cookie: "accessToken=test; csrfToken=test",
      ...overrides,
    },
  });
}

describe("Server Action CSRF protection", () => {
  it("allows same-origin page actions without the API CSRF header", () => {
    expect(isMutationRequestTrusted(actionRequest())).toBe(true);
  });

  it.each(["/api/v1/media", "/api"])("keeps token checks on %s even with an action header", (path) => {
    expect(isMutationRequestTrusted(actionRequest(path))).toBe(false);
    expect(isMutationRequestTrusted(actionRequest(path, { "x-csrf-token": "test" }))).toBe(true);
  });

  it.each<Record<string, string>>([
    { origin: "https://attacker.example" },
    { origin: "" },
    { origin: "null" },
    { "sec-fetch-site": "cross-site" },
    { "sec-fetch-site": "same-site" },
    { "next-action": "" },
  ])("rejects untrusted or unidentified page actions: %j", (headers) => {
    expect(isMutationRequestTrusted(actionRequest("/profile", headers))).toBe(false);
  });

  it("does not exempt non-POST mutations", () => {
    expect(isMutationRequestTrusted(actionRequest("/profile", {}, "DELETE"))).toBe(false);
  });
});
