import { describe, expect, it } from "vitest";

import { createSalonSchema as clientCreateSchema } from "../src/features/salon/schemas";
import { createSalonSchema, updateSalonSchema } from "../src/server/modules/salon/salon.schema";

const requiredInput = {
  name: "Test Salon",
  address: "123 Main Street",
  city: "Mumbai",
  state: "Maharashtra",
  zip: "400001",
  lat: 19,
  lng: 72,
};

const imageFields = ["coverImage", "bannerImage"] as const;

describe("salon cover and banner contract", () => {
  for (const [label, schema] of [["client", clientCreateSchema], ["server", createSalonSchema]] as const) {
    it(`${label} accepts legacy creation without dedicated images`, () => {
      expect(schema.safeParse(requiredInput).success).toBe(true);
    });

    it(`${label} keeps cover, banner and gallery independent`, () => {
      const input = {
        ...requiredInput,
        coverImage: "https://example.com/cover.jpg",
        bannerImage: "https://example.com/banner.jpg",
        images: ["https://example.com/gallery.jpg"],
      };
      expect(schema.parse(input)).toMatchObject(input);
    });

    for (const field of imageFields) {
      it(`${label} rejects invalid ${field} URLs`, () => {
        expect(schema.safeParse({ ...requiredInput, [field]: "invalid" }).success).toBe(false);
        expect(schema.safeParse({ ...requiredInput, [field]: `https://example.com/${"a".repeat(2048)}` }).success).toBe(false);
      });
    }
  }

  it("PATCH preserves omitted images", () => {
    expect(updateSalonSchema.parse({ name: "Renamed Salon" })).toEqual({ name: "Renamed Salon" });
  });

  it("PATCH can explicitly clear either image without replacing the gallery", () => {
    expect(updateSalonSchema.parse({ coverImage: null, bannerImage: null })).toEqual({ coverImage: null, bannerImage: null });
  });
});
