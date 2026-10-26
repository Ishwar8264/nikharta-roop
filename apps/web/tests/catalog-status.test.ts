import { describe, expect, it, vi } from "vitest";
import { resolveCatalogStatus } from "@nikharta-roop/shared/constants/catalog-status";
import { createServiceSchema, updateServiceSchema } from "@nikharta-roop/shared/schemas/service";
import { createProductSchema, updateProductSchema } from "@nikharta-roop/shared/schemas/product";
import { createPackageSchema, updatePackageSchema } from "@nikharta-roop/shared/schemas/package";

const mocks = vi.hoisted(() => ({ findMany: vi.fn().mockResolvedValue([]), findFirst: vi.fn().mockResolvedValue(null) }));
vi.mock("../src/lib/prisma", () => ({ prisma: { service: mocks, product: mocks, package: mocks } }));
import { findServiceBySlug } from "../src/server/modules/service/service.repository";
import { findProductBySlug } from "../src/server/modules/product/product.repository";
import { findPackageBySlug } from "../src/server/modules/package/package.repository";

describe("catalogue publication", () => {
  it("defaults omitted publication settings to draft and supports legacy clients", () => {
    expect(resolveCatalogStatus({})).toBe("DRAFT");
    expect(resolveCatalogStatus({ isActive: true })).toBe("PUBLISHED");
    expect(resolveCatalogStatus({ isActive: false })).toBe("PAUSED");
    expect(resolveCatalogStatus({ status: "ARCHIVED", isActive: true })).toBe("ARCHIVED");
  });
  for (const [create, update, input] of [
    [createServiceSchema, updateServiceSchema, { name: "Haircut", price: 300, duration: 30 }],
    [createProductSchema, updateProductSchema, { name: "Shampoo", price: 200 }],
    [createPackageSchema, updatePackageSchema, { name: "Hair combo", slug: "hair-combo", price: 500, duration: 60 }],
  ] as const) {
    it("accepts each state and preserves publication on unrelated edits", () => {
      expect(create.safeParse(input).success).toBe(true);
      expect(create.safeParse({ ...input, status: "PUBLISHED" }).success).toBe(false);
      expect(create.safeParse({ ...input, isActive: true }).success).toBe(false);
      for (const status of ["DRAFT", "PUBLISHED", "PAUSED", "ARCHIVED"] as const) {
        expect(update.parse({ status })).toEqual({ status });
      }
      expect(update.parse({ name: "New name" })).toEqual({ name: "New name" });
      expect(update.safeParse({ status: "PRIVATE" }).success).toBe(false);
    });
  }
  it("protects public direct URLs with the published filter", async () => {
    for (const lookup of [findServiceBySlug, findProductBySlug, findPackageBySlug]) {
      await lookup("salon", "item");
      expect(mocks.findFirst).toHaveBeenLastCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "PUBLISHED", isActive: true, deletedAt: null }) }));
    }
  });
});
