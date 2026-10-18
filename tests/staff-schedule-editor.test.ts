// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mocks = vi.hoisted(() => ({ replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), save: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: mocks.replace, back: mocks.back, refresh: mocks.refresh }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("../src/features/staff/api", () => ({ replaceScheduleApi: mocks.save }));
import { StaffScheduleEditor } from "../src/features/staff/staff-schedule-editor";
import { ApiError } from "../src/lib/api/backend.client";
afterEach(cleanup);
beforeEach(() => { vi.resetAllMocks(); mocks.save.mockResolvedValue({ data: { schedule: [] } }); });
function show(modal = false) {
  render(createElement(StaffScheduleEditor, { salonSlug: "salon", staffId: "member", schedule: [], detailHref: "/salons/salon/staff/priya", modal }));
}
it("provides a Back button that closes the intercepted editor without saving", async () => {
  const user = userEvent.setup(); show(true);
  expect(screen.getByRole("dialog")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Back" }));
  expect(mocks.back).toHaveBeenCalledOnce(); expect(mocks.save).not.toHaveBeenCalled();
});
it("cancels the direct page to the staff profile", async () => {
  const user = userEvent.setup(); show();
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(mocks.replace).toHaveBeenCalledWith("/salons/salon/staff/priya", { scroll: false });
});
it("saves seven days by member ID and refreshes the returned profile", async () => {
  const user = userEvent.setup(); show(true);
  await user.click(screen.getByRole("button", { name: "Save schedule" }));
  await waitFor(() => expect(mocks.save).toHaveBeenCalledWith("salon", "member", expect.objectContaining({ days: expect.arrayContaining([expect.objectContaining({ day: "MONDAY", isOff: true })]) })));
  expect(mocks.save.mock.calls[0][2].days).toHaveLength(7);
  expect(mocks.replace).toHaveBeenCalledWith("/salons/salon/staff/priya", { scroll: false });
  expect(mocks.refresh).toHaveBeenCalledOnce();
});
it("keeps the editor open on API failure", async () => {
  mocks.save.mockRejectedValue(new ApiError(400, "Invalid working hours"));
  const user = userEvent.setup(); show(true);
  await user.click(screen.getByRole("button", { name: "Save schedule" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Invalid working hours");
  expect(mocks.replace).not.toHaveBeenCalled();
});

it("shows time fields only when the day is working", async () => {
  const user = userEvent.setup(); show();
  expect(screen.queryByLabelText("Mon start time")).toBeNull();
  await user.click(screen.getByRole("switch", { name: "Mon working" }));
  expect(screen.getByRole("group", { name: "Mon start time" })).toBeTruthy();
  expect(screen.getByRole("group", { name: "Mon end time" })).toBeTruthy();
});
