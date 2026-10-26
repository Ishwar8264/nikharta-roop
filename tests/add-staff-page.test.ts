import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ session: vi.fn(), salon: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`redirect:${path}`); },
  notFound: () => { throw new Error("notFound"); },
}));
vi.mock("../src/lib/auth/get-session", () => ({ getSession: mocks.session }));
vi.mock("../src/server/modules/salon/salon.service", () => ({ getSalonForServiceManagement: mocks.salon }));
vi.mock("../src/features/staff/add-staff-form", () => ({ AddStaffForm: () => null }));
import AddStaffPage from "../src/app/(public)/salons/[slug]/staff/create/page";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ id: "owner" });
  mocks.salon.mockResolvedValue({ id: "salon", slug: "my-salon", name: "My salon", viewerRole: "OWNER" });
});
const props = () => ({ params: Promise.resolve({ slug: "my-salon" }) });
it("redirects signed-out users back to the create route after login", async () => {
  mocks.session.mockResolvedValue(null);
  await expect(AddStaffPage(props())).rejects.toThrow("redirect:/login?redirect=%2Fsalons%2Fmy-salon%2Fstaff%2Fcreate");
  expect(mocks.salon).not.toHaveBeenCalled();
});
it("does not render the owner-only form for managers", async () => {
  mocks.salon.mockResolvedValue({ viewerRole: "MANAGER" });
  await expect(AddStaffPage(props())).rejects.toThrow("notFound");
});
it("passes the authorized salon to the creation form", async () => {
  const page = await AddStaffPage(props());
  expect(mocks.salon).toHaveBeenCalledWith("my-salon", "owner");
  expect(page.props.children.props).toEqual({ salonId: "salon", salonSlug: "my-salon", salonName: "My salon" });
});
