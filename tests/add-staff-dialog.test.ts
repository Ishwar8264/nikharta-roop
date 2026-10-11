// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mocks = vi.hoisted(() => ({ add: vi.fn(), push: vi.fn(), refresh: vi.fn(), success: vi.fn(), warning: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, warning: mocks.warning } }));
vi.mock("../src/features/salon/api/manage", () => ({ addSalonMemberApi: mocks.add }));
vi.mock("../src/features/media", () => ({ MediaPickerDialog: ({ onChange }: { onChange: (images: Array<{ url: string; publicId: string }>) => void }) => createElement("button", { type: "button", onClick: () => onChange([{ url: "https://example.com/photo.png", publicId: "photo" }]) }, "Choose photo") }));
import { AddStaffDialog } from "../src/features/staff/add-staff-dialog";
import { ApiError } from "../src/lib/api/backend.client";
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  mocks.add.mockResolvedValue({ data: { member: { id: "member", user: { emailVerified: false }, verificationEmailSent: true } } });
});
async function open() {
  const user = userEvent.setup();
  render(createElement(AddStaffDialog, { salonId: "salon", salonSlug: "my-salon" }));
  await user.click(screen.getByRole("button", { name: "Add staff" }));
  await screen.findByLabelText(/^Name/);
  return user;
}
it("submits a complete salon profile and opens its staff editor", async () => {
  const user = await open();
  await user.type(screen.getByLabelText(/^Name/), "Salon stylist");
  await user.type(screen.getByLabelText(/^Email/), "new@example.com");
  await user.type(screen.getByLabelText("Professional title (optional)"), "Hair stylist");
  await user.type(screen.getByLabelText("Description (optional)"), "Hair specialist");
  await user.click(screen.getByRole("button", { name: "Choose photo" }));
  await user.click(screen.getAllByRole("button", { name: "Add staff" }).at(-1)!);
  await waitFor(() => expect(mocks.add).toHaveBeenCalledWith("salon", { name: "Salon stylist", email: "new@example.com", avatar: "https://example.com/photo.png", title: "Hair stylist", description: "Hair specialist", role: "STAFF" }));
  expect(mocks.push).toHaveBeenCalledWith("/salons/my-salon/manage/staff/member");
  expect(mocks.success).toHaveBeenCalledWith("Staff added. Email verification is pending.");
});
it("keeps backend errors visible without redirecting", async () => {
  mocks.add.mockRejectedValue(new ApiError(409, "This user is already a member of the salon"));
  const user = await open();
  await user.type(screen.getByLabelText(/^Name/), "Stylist");
  await user.type(screen.getByLabelText(/^Email/), "existing@example.com");
  await user.click(screen.getAllByRole("button", { name: "Add staff" }).at(-1)!);
  expect((await screen.findByRole("alert")).textContent).toContain("already a member");
  expect(mocks.push).not.toHaveBeenCalled();
});
it("reports a saved profile with failed email delivery without duplicating the add", async () => {
  mocks.add.mockResolvedValue({ data: { member: { id: "member", user: { emailVerified: false }, verificationEmailSent: false } } });
  const user = await open();
  await user.type(screen.getByLabelText(/^Name/), "Stylist");
  await user.type(screen.getByLabelText(/^Email/), "new@example.com");
  await user.click(screen.getAllByRole("button", { name: "Add staff" }).at(-1)!);
  await waitFor(() => expect(mocks.warning).toHaveBeenCalledOnce());
  expect(mocks.add).toHaveBeenCalledOnce();
  expect(mocks.push).toHaveBeenCalled();
});
