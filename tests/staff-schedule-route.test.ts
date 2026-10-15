import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ session: vi.fn(), salon: vi.fn(), lookup: vi.fn(), staff: vi.fn(), schedule: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); }, notFound: () => { throw new Error("notFound"); } }));
vi.mock("../src/lib/auth/get-session", () => ({ getSession: mocks.session }));
vi.mock("../src/server/modules/salon/salon.service", () => ({ getSalonForServiceManagement: mocks.salon }));
vi.mock("../src/server/modules/salon/salon.repository", () => ({ findSalonMemberBySlug: mocks.lookup }));
vi.mock("../src/server/modules/staff/staff.service", () => ({ getStaffDetail: mocks.staff, getSchedule: mocks.schedule }));
vi.mock("../src/features/staff/staff-schedule-editor", () => ({ StaffScheduleEditor: () => null }));
import { StaffScheduleRoute } from "../src/features/staff/staff-schedule-route";
const id = "b".repeat(48);
const props = (modal: boolean, staffId = "priya") => ({ modal, params: Promise.resolve({ slug: "salon", staffId }) });
beforeEach(() => {
  vi.resetAllMocks(); mocks.session.mockResolvedValue({ id: "owner" });
  mocks.salon.mockResolvedValue({ id: "salon-id", viewerRole: "OWNER" });
  mocks.lookup.mockResolvedValue({ id }); mocks.staff.mockResolvedValue({ id, slug: "priya" }); mocks.schedule.mockResolvedValue([]);
});
it.each([true, false])("authorizes and resolves the same editor for modal=%s", async (modal) => {
  const page = await StaffScheduleRoute(props(modal));
  const editor = modal ? page : page.props.children;
  expect(editor.props).toMatchObject({ modal, staffId: id, detailHref: "/salons/salon/staff/priya" });
  expect(mocks.schedule).toHaveBeenCalledWith("owner", "salon", id);
});
it.each([true, false])("blocks non-owner editor access for modal=%s", async (modal) => {
  mocks.salon.mockResolvedValue({ id: "salon-id", viewerRole: "MANAGER" });
  await expect(StaffScheduleRoute(props(modal))).rejects.toThrow("notFound");
  expect(mocks.schedule).not.toHaveBeenCalled();
});
it("preserves the schedule URL through login", async () => {
  mocks.session.mockResolvedValue(null);
  await expect(StaffScheduleRoute(props(true))).rejects.toThrow("redirect:/login?redirect=%2Fsalons%2Fsalon%2Fstaff%2Fpriya%2Fschedule");
});
