import { describe, expect, it } from "vitest";
import { slugAvailabilityQuerySchema } from "@nikharta-roop/shared/schemas/slug";

const salonId = "a".repeat(48);

describe("slug availability query", () => {
  it("requires salonId only for scoped resources", () => {
    for (const resource of ["service", "product", "package"]) {
      expect(slugAvailabilityQuerySchema.safeParse({ resource, slug: "haircut" }).success).toBe(
        false,
      );
      expect(
        slugAvailabilityQuerySchema.safeParse({ resource, slug: "haircut", salonId }).success,
      ).toBe(true);
    }
    expect(
      slugAvailabilityQuerySchema.safeParse({ resource: "salon", slug: "salon", salonId }).success,
    ).toBe(false);
  });

  it("matches resource slug limits and rejects unsupported inputs", () => {
    expect(
      slugAvailabilityQuerySchema.safeParse({ resource: "blog-post", slug: "a".repeat(120) })
        .success,
    ).toBe(true);
    for (const slug of ["a", "Salon", "with spaces", "two--hyphens", "-salon", "a".repeat(81)]) {
      expect(slugAvailabilityQuerySchema.safeParse({ resource: "salon", slug }).success).toBe(
        false,
      );
    }
    expect(slugAvailabilityQuerySchema.safeParse({ resource: "user", slug: "test" }).success).toBe(
      false,
    );
    expect(
      slugAvailabilityQuerySchema.safeParse({ resource: "salon", slug: "test", table: "User" })
        .success,
    ).toBe(false);
  });
});
