import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ post: vi.fn(), patch: vi.fn() }));
vi.mock("../src/lib/api/backend.client", () => ({ api: mocks }));
import { createServiceApi, updateServiceApi } from "../src/features/service/api";
import { createProductApi, updateProductApi } from "../src/features/product/api";
import { createPackageApi, updatePackageApi } from "../src/features/package/api";
import { updateSalonApi } from "../src/features/salon/api/manage";

beforeEach(() => { vi.clearAllMocks(); mocks.patch.mockResolvedValue({ data: {} }); });
describe("create then publish API flow", () => {
  it("never sends publication controls during creation", async () => {
    await createServiceApi("salon", { name: "Haircut", price: 100, duration: 30, images: [], status: "DRAFT" });
    await createProductApi("salon", { name: "Shampoo", price: 100, stock: 1, images: [], status: "DRAFT" });
    await createPackageApi("salon", { name: "Combo", slug: "combo", price: 100, duration: 30, status: "DRAFT" });
    expect(mocks.post).toHaveBeenCalledTimes(3);
    for (const [, body] of mocks.post.mock.calls) {
      expect(body).not.toHaveProperty("status");
      expect(body).not.toHaveProperty("isActive");
    }
  });
  it("sends status-only updates to dedicated endpoints", async () => {
    await updateSalonApi("salon", { status: "LIVE" });
    await updateServiceApi("salon", "item", { status: "PUBLISHED" });
    await updateProductApi("salon", "item", { status: "PUBLISHED" });
    await updatePackageApi("salon", "item", { status: "PUBLISHED" });
    expect(mocks.patch.mock.calls.map(([path]) => path)).toEqual([
      "/salons/salon/status", "/salons/salon/services/item/status", "/salons/salon/products/item/status", "/salons/salon/packages/item/status",
    ]);
  });
  it("saves profile details before requesting publication and stops on failure", async () => {
    await updateSalonApi("salon", { name: "Updated salon", status: "LIVE" });
    expect(mocks.patch.mock.calls).toEqual([["/salons/salon", { name: "Updated salon" }], ["/salons/salon/status", { status: "LIVE" }]]);
    mocks.patch.mockClear();
    mocks.patch.mockRejectedValueOnce(new Error("Details could not be saved"));
    await expect(updateSalonApi("salon", { name: "Updated salon", status: "LIVE" })).rejects.toThrow("Details could not be saved");
    expect(mocks.patch).toHaveBeenCalledTimes(1);
  });
});
