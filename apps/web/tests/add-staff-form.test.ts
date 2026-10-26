// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mocks = vi.hoisted(() => ({ add: vi.fn(), update: vi.fn(), push: vi.fn(), refresh: vi.fn(), success: vi.fn(), warning: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, warning: mocks.warning } }));
vi.mock("../src/features/salon/api/manage", () => ({ addSalonMemberApi: mocks.add, updateSalonMemberApi: mocks.update }));
vi.mock("../src/features/media", () => ({ MediaPickerDialog: ({ onChange, title }: { title?: string; onChange: (images: Array<{ url: string; publicId: string }>) => void }) => createElement("button", { type: "button", onClick: () => onChange([{ url: title === "Choose staff banner" ? "https://example.com/banner.png" : "https://example.com/photo.png", publicId: "photo" }]) }, title === "Choose staff banner" ? "Choose banner" : "Choose photo") }));
import { AddStaffForm } from "../src/features/staff/add-staff-form";
import { ApiError } from "../src/lib/api/backend.client";
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  mocks.add.mockResolvedValue({ data: { member: { id: "member", user: { emailVerified: false }, verificationEmailSent: true } } });
});
async function open() {
  const user = userEvent.setup();
  render(createElement(AddStaffForm, { salonId: "salon", salonSlug: "my-salon", salonName: "My salon" }));
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
  await user.click(screen.getByRole("button", { name: "Choose banner" }));
  await user.click(screen.getAllByRole("button", { name: "Add staff" }).at(-1)!);
  await waitFor(() => expect(mocks.add).toHaveBeenCalledWith("salon", { name: "Salon stylist", slug: "salon-stylist", email: "new@example.com", avatar: "https://example.com/photo.png", bannerImage: "https://example.com/banner.png", title: "Hair stylist", description: "Hair specialist", role: "STAFF" }));
  expect(mocks.push).toHaveBeenCalledWith("/salons/my-salon/staff/member");
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
it("shows inline validation and does not submit an empty profile", async () => {
  const user = await open();
  await user.click(screen.getByRole("button", { name: "Add staff" }));
  expect(await screen.findByText("Enter at least 2 characters.")).toBeTruthy();
  expect(screen.getByText("Enter a valid email address.")).toBeTruthy();
  expect(mocks.add).not.toHaveBeenCalled();
  expect(mocks.push).not.toHaveBeenCalled();
});
it("saves the selected manager role and normalizes profile input", async () => {
  const user = await open();
  await user.type(screen.getByLabelText(/^Name/), "  Stylist  ");
  await user.type(screen.getByLabelText(/^Email/), "STAFF@example.com");
  await user.click(screen.getByRole("button", { name: "Staff Salon role" }));
  await user.click(await screen.findByRole("option", { name: "Manager" }));
  await user.click(screen.getByRole("button", { name: "Add staff" }));
  await waitFor(() => expect(mocks.add).toHaveBeenCalledWith("salon", {
    name: "Stylist", slug: "stylist", email: "staff@example.com", avatar: null, bannerImage: null,
    title: null, description: null, role: "MANAGER",
  }));
});
it("removes a selected banner without clearing the profile photo", async () => {
  const user = await open();
  await user.type(screen.getByLabelText(/^Name/), "Salon stylist");
  await user.type(screen.getByLabelText(/^Email/), "new@example.com");
  await user.click(screen.getByRole("button", { name: "Choose photo" }));
  await user.click(screen.getByRole("button", { name: "Choose banner" }));
  await user.click(screen.getByRole("button", { name: "Remove banner image" }));
  expect(screen.queryByRole("button", { name: "Remove banner image" })).toBeNull();
  expect(screen.getByRole("button", { name: "Remove profile photo" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Add staff" }));
  await waitFor(() => expect(mocks.add).toHaveBeenCalledWith("salon", expect.objectContaining({ avatar: "https://example.com/photo.png", bannerImage: null })));
});

it("auto-fills the slug from the name and preserves a manually edited slug", async () => {
  const user = await open();
  await user.type(screen.getByLabelText(/^Name/), "Priya Sharma");
  expect((screen.getByLabelText(/^Slug/) as HTMLInputElement).value).toBe("priya-sharma");
  await user.clear(screen.getByLabelText(/^Slug/));
  await user.type(screen.getByLabelText(/^Slug/), "priya-stylist");
  await user.type(screen.getByLabelText(/^Name/), " Singh");
  expect((screen.getByLabelText(/^Slug/) as HTMLInputElement).value).toBe("priya-stylist");
  await user.type(screen.getByLabelText(/^Email/), "priya@example.com");
  await user.click(screen.getByRole("button", { name: "Add staff" }));
  await waitFor(() => expect(mocks.add).toHaveBeenCalledWith("salon", expect.objectContaining({ slug: "priya-stylist" })));
});

it("prefills edit mode, preserves its slug on rename, and saves only profile fields", async () => {
  const user = userEvent.setup();
  mocks.update.mockResolvedValue({ data: { member: { id: "member", slug: "updated-stylist" } } });
  render(createElement(AddStaffForm, { salonId: "salon", salonSlug: "my-salon", salonName: "My salon", member: {
    id: "member", userId: "staff-user", salonId: "salon", role: "STAFF", name: "Stylist", slug: "original-stylist",
    title: "Hair stylist", description: "Experienced", avatar: null, bannerImage: null,
    user: { id: "staff-user", name: "Personal name", email: "staff@example.com", avatar: null, emailVerified: true },
  } }));
  expect((screen.getByLabelText(/^Email/) as HTMLInputElement).readOnly).toBe(true);
  expect((screen.getByLabelText("Salon role") as HTMLInputElement).readOnly).toBe(true);
  await user.type(screen.getByLabelText(/^Name/), " Renamed");
  expect((screen.getByLabelText(/^Slug/) as HTMLInputElement).value).toBe("original-stylist");
  await user.clear(screen.getByLabelText(/^Slug/));
  await user.type(screen.getByLabelText(/^Slug/), "updated-stylist");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(mocks.update).toHaveBeenCalledWith("salon", "member", {
    name: "Stylist Renamed", slug: "updated-stylist", title: "Hair stylist", description: "Experienced", avatar: null, bannerImage: null,
  }));
  expect(mocks.add).not.toHaveBeenCalled();
  expect(mocks.push).toHaveBeenCalledWith("/salons/my-salon/staff/updated-stylist");
});
