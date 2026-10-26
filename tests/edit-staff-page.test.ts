import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), salon: vi.fn(), slug: vi.fn(), member: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); }, notFound: () => { throw new Error("notFound"); } }));
vi.mock("../src/lib/auth/get-session", () => ({ getSession: mocks.session }));
vi.mock("../src/server/modules/salon/salon.repository", () => ({ findSalonForViewer: mocks.salon, findSalonMemberBySlug: mocks.slug }));
vi.mock("../src/server/modules/staff/staff.repository", () => ({ findStaffMemberInSalon: mocks.member }));
vi.mock("../src/features/staff/add-staff-form", () => ({ AddStaffForm: () => null }));
import Page from "../src/app/(public)/salons/[slug]/staff/[staffId]/edit/page";
const memberId = "a".repeat(48);
const props = (staffId = "stylist") => ({ params: Promise.resolve({ slug: "salon", staffId }) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ id: "viewer" });
  mocks.salon.mockResolvedValue({ id: "salon-id", slug: "salon", name: "Salon", viewerRole: "OWNER" });
  mocks.slug.mockResolvedValue({ id: memberId });
  mocks.member.mockResolvedValue({ id: memberId, userId: "staff-user" });
});
it("allows an owner to edit a salon member via slug", async () => {
  const page = await Page(props());
  expect(page.props.children.props.member.id).toBe(memberId);
  expect(mocks.slug).toHaveBeenCalledWith("salon-id", "stylist");
  expect(mocks.member).toHaveBeenCalledWith(memberId, "salon-id");
});
it("allows a staff member to edit their own profile via ID", async () => {
  mocks.salon.mockResolvedValue({ id: "salon-id", slug: "salon", viewerRole: "STAFF" });
  mocks.member.mockResolvedValue({ id: memberId, userId: "viewer" });
  expect(await Page(props(memberId))).toBeTruthy();
  expect(mocks.slug).not.toHaveBeenCalled();
});
it.each(["STAFF", "MANAGER"])("rejects %s editing another member", async (viewerRole) => {
  mocks.salon.mockResolvedValue({ id: "salon-id", viewerRole });
  await expect(Page(props())).rejects.toThrow("notFound");
});
it("redirects anonymous users back to the edit page", async () => {
  mocks.session.mockResolvedValue(null);
  await expect(Page(props())).rejects.toThrow("redirect:/login?redirect=%2Fsalons%2Fsalon%2Fstaff%2Fstylist%2Fedit");
  expect(mocks.salon).not.toHaveBeenCalled();
});
it("does not allow a member from another salon", async () => {
  mocks.member.mockResolvedValue(null);
  await expect(Page(props(memberId))).rejects.toThrow("notFound");
});
