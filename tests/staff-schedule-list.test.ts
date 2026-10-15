// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StaffDetailPanel } from "../src/features/staff/staff-detail-panel";
import type { PublicScheduleDay } from "../src/features/staff/types";
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
afterEach(cleanup);
function show(schedule: PublicScheduleDay[], viewerRole: "OWNER" | "STAFF" = "OWNER") {
  render(createElement(StaffDetailPanel, { salonSlug: "salon", staffId: "member", staff: { id: "member", userId: "staff", salonId: "salon", role: "STAFF", name: "Staff", avatar: null, title: null, description: null, user: { id: "staff", name: "Staff", email: null, avatar: null, emailVerified: true } }, schedule, viewerRole, viewerId: "staff", leaves: [], skills: [], services: [], salonTimezone: "Asia/Kolkata" }));
}
it("shows only saved schedule rows without editable inputs", () => {
  show([{ id: "tue", day: "TUESDAY", startTime: "10:00", endTime: "17:00", isOff: false }]);
  expect(screen.getByText("Tue")).toBeTruthy();
  expect(screen.getByText("10:00 – 17:00")).toBeTruthy();
  expect(screen.queryByText("Mon")).toBeNull();
  expect(screen.queryByRole("switch")).toBeNull();
});
it("opens the existing editor only after Add and returns to the empty list on Cancel", async () => {
  const user = userEvent.setup();
  show([]);
  expect(screen.getByText("No schedule added yet.")).toBeTruthy();
  expect(screen.queryByRole("switch")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Add schedule" }));
  expect(screen.getAllByRole("switch")).toHaveLength(7);
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByText("No schedule added yet.")).toBeTruthy();
});
it("keeps schedule modification controls owner-only", () => {
  show([], "STAFF");
  expect(screen.queryByRole("button", { name: "Add schedule" })).toBeNull();
});
