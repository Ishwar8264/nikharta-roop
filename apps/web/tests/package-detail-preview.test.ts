import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), publicPackage: vi.fn(), managedPackage: vi.fn(), publicSalon: vi.fn(), managedSalon: vi.fn() }));
vi.mock("../src/lib/auth/get-session", () => ({ getSession: mocks.session }));
vi.mock("../src/server/modules/package/package.service", () => ({ getPublicPackageById: mocks.publicPackage, getManagedSalonPackage: mocks.managedPackage }));
vi.mock("../src/server/modules/salon/salon.service", () => ({ getSalonSummaryBySlug: mocks.publicSalon, getSalonForServiceManagement: mocks.managedSalon }));
import PackageDetailPage, { generateMetadata } from "../src/app/(public)/salons/[slug]/packages/[packageId]/page";
import { PackageNotFoundError } from "../src/server/modules/package/package.errors";
import { SalonRoleInsufficientError } from "../src/server/modules/salon/salon.errors";
const packageId = "a".repeat(48);
const props = { params: Promise.resolve({ slug: "salon", packageId }) };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.publicPackage.mockRejectedValue(new PackageNotFoundError());
  mocks.publicSalon.mockResolvedValue({ name: "Salon", status: "LIVE" });
  mocks.managedSalon.mockResolvedValue({ name: "Salon", status: "LIVE" });
  mocks.managedPackage.mockResolvedValue({ id: packageId, salonId: "salon", name: "Draft combo", status: "DRAFT", services: [], price: 100, duration: 30 });
});
describe("package ID details", () => {
  it("renders an authorized draft preview", async () => {
    mocks.session.mockResolvedValue({ id: "manager" });
    expect(await PackageDetailPage(props)).toBeTruthy();
    expect(mocks.managedPackage).toHaveBeenCalledWith("manager", "salon", packageId);
    expect(await generateMetadata(props)).toEqual({ title: "Draft combo", robots: { index: false, follow: false } });
  });
  it("does not expose drafts to anonymous visitors", async () => {
    mocks.session.mockResolvedValue(null);
    expect(await generateMetadata(props)).toEqual({ title: "Package not found" });
    expect(mocks.managedPackage).not.toHaveBeenCalled();
  });
  it("rejects unauthorized draft access", async () => {
    mocks.session.mockResolvedValue({ id: "visitor" });
    mocks.managedSalon.mockRejectedValue(new SalonRoleInsufficientError());
    expect(await generateMetadata(props)).toEqual({ title: "Package not found" });
  });
  it("keeps published package metadata public", async () => {
    mocks.publicPackage.mockResolvedValue({ name: "Published combo" });
    expect(await generateMetadata(props)).toEqual({ title: "Published combo" });
    expect(mocks.managedPackage).not.toHaveBeenCalled();
  });
});
