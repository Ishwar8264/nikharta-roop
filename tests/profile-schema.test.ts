import { describe, expect, it } from "vitest";

import { updateProfileSchema } from "../src/server/modules/auth/auth.schema";

// Cover updates must stay partial and cannot change protected account fields.
describe("profile cover updates", () => {
  it("accepts a cover-only update and trims its URL", () => {
    expect(updateProfileSchema.parse({ coverImage: " https://example.com/cover.jpg " }))
      .toEqual({ coverImage: "https://example.com/cover.jpg" });
  });

  it("accepts removal without requiring other profile fields", () => {
    expect(updateProfileSchema.parse({ coverImage: null })).toEqual({ coverImage: null });
  });

  it("rejects invalid and oversized cover URLs", () => {
    expect(updateProfileSchema.safeParse({ coverImage: "invalid" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ coverImage: `https://example.com/${"x".repeat(2048)}` }).success).toBe(false);
  });

  it("rejects changes to protected fields and empty updates", () => {
    expect(updateProfileSchema.safeParse({ coverImage: null, role: "ADMIN" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({}).success).toBe(false);
  });
});
