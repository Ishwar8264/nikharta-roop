import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), publicProduct: vi.fn(), managedProduct: vi.fn(), publicSalon: vi.fn(), managedSalon: vi.fn(), reviews: vi.fn() }));
vi.mock("../src/lib/auth/get-session", () => ({ getSession: mocks.session }));
vi.mock("../src/server/modules/product/product.service", () => ({ getSalonProduct: mocks.publicProduct, getManagedSalonProduct: mocks.managedProduct }));
vi.mock("../src/server/modules/salon/salon.service", () => ({ getSalonSummaryBySlug: mocks.publicSalon, getSalonForServiceManagement: mocks.managedSalon }));
vi.mock("../src/server/modules/review/review.service", () => ({ listReviewsForProduct: mocks.reviews }));
import ProductDetailPage, { generateMetadata } from "../src/app/(public)/salons/[slug]/products/[productSlug]/page";
import { ProductNotFoundError } from "../src/server/modules/product/product.errors";
import { SalonNotFoundError, SalonRoleInsufficientError } from "../src/server/modules/salon/salon.errors";
const props = { params: Promise.resolve({ slug: "salon", productSlug: "haircut" }) };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.publicProduct.mockRejectedValue(new ProductNotFoundError());
  mocks.publicSalon.mockResolvedValue({ status: "LIVE" });
  mocks.managedSalon.mockResolvedValue({ id: "salon-id", status: "LIVE" });
  mocks.managedProduct.mockResolvedValue({ id: "product-id", name: "Private draft", slug: "haircut", status: "DRAFT", images: [], price: 100, stock: 30 });
  mocks.reviews.mockResolvedValue({ items: [], summary: { average: 0, count: 0 }, hasMore: false, nextCursor: null });
});
describe("private product detail preview", () => {
  it("renders the draft detail without calling public reviews", async () => {
    mocks.session.mockResolvedValue({ id: "manager" });
    expect(await ProductDetailPage(props)).toBeTruthy();
    expect(mocks.reviews).not.toHaveBeenCalled();
  });
  it("continues to load reviews for published product details", async () => {
    mocks.session.mockResolvedValue(null);
    mocks.publicProduct.mockResolvedValue({ id: "product-id", name: "Haircut", images: [], price: 100, duration: 30 });
    expect(await ProductDetailPage(props)).toBeTruthy();
    expect(mocks.reviews).toHaveBeenCalledWith("product-id", { limit: 20, sort: "recent" });
  });
  it("does not expose drafts to anonymous visitors", async () => {
    mocks.session.mockResolvedValue(null);
    expect(await generateMetadata(props)).toEqual({ title: "Product not found" });
    expect(mocks.managedProduct).not.toHaveBeenCalled();
  });
  for (const error of [new SalonNotFoundError(), new SalonRoleInsufficientError()]) {
    it(`does not expose drafts when management access is rejected with ${error.name}`, async () => {
      mocks.session.mockResolvedValue({ id: "visitor" });
      mocks.managedSalon.mockRejectedValue(error);
      expect(await generateMetadata(props)).toEqual({ title: "Product not found" });
      expect(mocks.managedProduct).not.toHaveBeenCalled();
    });
  }
  it("allows the authorized management preview and marks it noindex", async () => {
    mocks.session.mockResolvedValue({ id: "manager" });
    expect(await generateMetadata(props)).toEqual({ title: "Private draft", robots: { index: false, follow: false } });
    expect(mocks.managedProduct).toHaveBeenCalledWith("manager", "salon", "haircut", "slug");
  });
  it("keeps published product metadata public", async () => {
    mocks.publicProduct.mockResolvedValue({ name: "Haircut", images: [], shortDescription: "A haircut" });
    expect(await generateMetadata(props)).toMatchObject({ title: "Haircut", description: "A haircut" });
    expect(mocks.managedProduct).not.toHaveBeenCalled();
  });
});
