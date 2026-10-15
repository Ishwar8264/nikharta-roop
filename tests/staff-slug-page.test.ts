import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), salon: vi.fn(), lookup: vi.fn(), staff: vi.fn(), schedule: vi.fn(), leaves: vi.fn(), skills: vi.fn(), services: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); }, notFound: () => { throw new Error("notFound"); } }));
vi.mock("../src/lib/auth/get-session", () => ({ getSession: mocks.session }));
vi.mock("../src/server/modules/salon/salon.repository", () => ({ findSalonMemberBySlug: mocks.lookup }));
vi.mock("../src/server/modules/salon/salon.service", () => ({ getSalonForServiceManagement: mocks.salon }));
vi.mock("../src/server/modules/staff/staff.service", () => ({ getStaffDetail: mocks.staff, getSchedule: mocks.schedule, listLeaves: mocks.leaves, getSkills: mocks.skills }));
vi.mock("../src/server/modules/service/service.service", () => ({ listManagedSalonServices: mocks.services }));
vi.mock("../src/features/staff/staff-detail-panel", () => ({ StaffDetailPanel: () => null }));
vi.mock("../src/features/staff/staff-verification-notice", () => ({ StaffVerificationNotice: () => null }));
import Page from "../src/app/(public)/salons/[slug]/staff/[staffId]/page";
const memberId = "b".repeat(48);
const props = (staffId: string) => ({ params: Promise.resolve({ slug: "glow-salon", staffId }) });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ id: "owner" });
  mocks.salon.mockResolvedValue({ id: "salon", name: "Glow Salon", viewerRole: "OWNER", timezone: "Asia/Kolkata" });
  mocks.lookup.mockResolvedValue({ id: memberId });
  mocks.staff.mockResolvedValue({ id: memberId, name: "Stylist", role: "STAFF", user: { name: "Stylist", emailVerified: true } });
  mocks.schedule.mockResolvedValue([]); mocks.leaves.mockResolvedValue({ items: [] }); mocks.skills.mockResolvedValue([]); mocks.services.mockResolvedValue({ items: [] });
});
it("resolves the salon-scoped slug before passing IDs to staff services", async () => {
  await Page(props("salon-stylist"));
  expect(mocks.lookup).toHaveBeenCalledWith("salon", "salon-stylist");
  for (const service of [mocks.staff, mocks.schedule, mocks.leaves, mocks.skills]) expect(service).toHaveBeenCalledWith("owner", "glow-salon", memberId);
});
it("continues to serve legacy membership ID URLs", async () => {
  await Page(props(memberId));
  expect(mocks.lookup).not.toHaveBeenCalled();
  expect(mocks.staff).toHaveBeenCalledWith("owner", "glow-salon", memberId);
});
it("rejects unknown slugs without reading staff data", async () => {
  mocks.lookup.mockResolvedValue(null);
  await expect(Page(props("unknown"))).rejects.toThrow("notFound");
  expect(mocks.staff).not.toHaveBeenCalled();
});
it("keeps the requested slug through the login redirect", async () => {
  mocks.session.mockResolvedValue(null);
  await expect(Page(props("salon-stylist"))).rejects.toThrow("redirect:/login?redirect=%2Fsalons%2Fglow-salon%2Fstaff%2Fsalon-stylist");
  expect(mocks.lookup).not.toHaveBeenCalled();
});
