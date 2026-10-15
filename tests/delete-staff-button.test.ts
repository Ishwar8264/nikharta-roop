// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mocks = vi.hoisted(() => ({ remove: vi.fn(), push: vi.fn(), refresh: vi.fn(), success: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.success } }));
vi.mock("../src/features/salon/api/manage", () => ({ removeSalonMemberApi: mocks.remove }));
import { DeleteStaffButton } from "../src/features/staff/delete-staff-button";
import { ApiError } from "../src/lib/api/backend.client";
afterEach(cleanup);
beforeEach(() => { vi.resetAllMocks(); mocks.remove.mockResolvedValue({ data: null }); });
async function open() {
  const user = userEvent.setup();
  render(createElement(DeleteStaffButton, { salonId: "salon-id", salonSlug: "glow-salon", memberId: "member-id", memberName: "Priya" }));
  await user.click(screen.getByRole("button", { name: "Delete member" }));
  return user;
}
it("requires confirmation and allows cancellation without deleting", async () => {
  const user = await open();
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(mocks.remove).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(mocks.remove).not.toHaveBeenCalled();
});
it("removes the membership by ID and returns to the salon staff list", async () => {
  const user = await open();
  await user.click(screen.getByRole("button", { name: "Confirm delete" }));
  await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("salon-id", "member-id"));
  expect(mocks.push).toHaveBeenCalledWith("/salons/glow-salon/staff");
  expect(mocks.refresh).toHaveBeenCalledOnce();
});
it("keeps the confirmation open and shows API errors without navigating", async () => {
  mocks.remove.mockRejectedValue(new ApiError(403, "Insufficient permission"));
  const user = await open();
  await user.click(screen.getByRole("button", { name: "Confirm delete" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Insufficient permission");
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(mocks.push).not.toHaveBeenCalled();
});
