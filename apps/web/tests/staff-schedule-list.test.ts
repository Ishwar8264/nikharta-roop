// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { StaffDetailPanel } from "../src/features/staff/staff-detail-panel";
import type { PublicScheduleDay } from "@nikharta-roop/shared/types/client/staff";
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
it("links Add to the intercepted schedule route without opening an inline editor", () => {
  show([]);
  expect(screen.getByText("No schedule added yet.")).toBeTruthy();
  expect(screen.queryByRole("switch")).toBeNull();
  expect(screen.getByRole("link", { name: "Add schedule" }).getAttribute("href")).toBe("/salons/salon/staff/member/schedule");
});
it("keeps schedule modification controls owner-only", () => {
  show([], "STAFF");
  expect(screen.queryByRole("link", { name: "Add schedule" })).toBeNull();
});
