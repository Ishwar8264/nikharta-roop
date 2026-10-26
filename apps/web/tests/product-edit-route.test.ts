import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), salon: vi.fn(), product: vi.fn(), categories: vi.fn() }));
vi.mock("../src/lib/auth/get-session", () => ({ getSession: mocks.session }));
vi.mock("../src/server/modules/product/product.service", () => ({ getManagedSalonProduct: mocks.product, listAllProductCategories: mocks.categories }));
vi.mock("../src/server/modules/salon/salon.service", () => ({ getSalonForServiceManagement: mocks.salon }));
vi.mock("../src/features/product/product-form", () => ({ ProductForm: () => null }));
vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); }, notFound: () => { throw new Error("not-found"); } }));
import EditProductPage from "../src/app/(public)/salons/[slug]/products/[productSlug]/edit/page";
import LegacyEditProductPage from "../src/app/(public)/salons/[slug]/catalog/products/[productId]/page";
import { SalonRoleInsufficientError } from "../src/server/modules/salon/salon.errors";
const props = { params: Promise.resolve({ slug: "salon", productSlug: "shampoo" }) };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ id: "manager" });
  mocks.salon.mockResolvedValue({ id: "salon-id", slug: "salon", name: "Salon" });
  mocks.product.mockResolvedValue({ id: "product-id", slug: "shampoo" });
  mocks.categories.mockResolvedValue([]);
});
describe("product edit routes", () => {
  it("loads the edit form through an authorized slug lookup", async () => {
    expect(await EditProductPage(props)).toBeTruthy();
    expect(mocks.product).toHaveBeenCalledWith("manager", "salon", "shampoo", "slug");
  });
  it("redirects anonymous users to login with the new edit URL", async () => {
    mocks.session.mockResolvedValue(null);
    await expect(EditProductPage(props)).rejects.toThrow("redirect:/login?redirect=%2Fsalons%2Fsalon%2Fproducts%2Fshampoo%2Fedit");
    expect(mocks.product).not.toHaveBeenCalled();
  });
  it("does not render an unauthorized edit form", async () => {
    mocks.salon.mockRejectedValue(new SalonRoleInsufficientError());
    await expect(EditProductPage(props)).rejects.toThrow("not-found");
  });
  it("redirects authorized legacy ID links to the slug edit route", async () => {
    await expect(LegacyEditProductPage({ params: Promise.resolve({ slug: "salon", productId: "product-id" }) })).rejects.toThrow("redirect:/salons/salon/products/shampoo/edit");
    expect(mocks.product).toHaveBeenCalledWith("manager", "salon", "product-id");
  });
});
