// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "../src/features/auth/components/userMenu";
import type { CurrentUser } from "../src/features/auth/shared/types";

vi.mock("next/navigation", () => ({ usePathname: () => "/profile", useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../src/features/auth/hooks/useLogout", () => ({ useLogout: () => ({ logout: vi.fn(), isLoading: false }) }));
afterEach(cleanup);
const user: CurrentUser = {
  id: "u", name: "Member", email: "member@example.test", phone: null,
  avatar: null, coverImage: null, bio: null, lat: null, lng: null, role: "USER",
  isOnboarded: false, accountType: null, onboardingCompletedAt: null,
  partnerCompletedAt: null, partnerTermsVersion: null, partnerTermsAcceptedAt: null,
  partnerEligibilityBackfilledAt: null, emailVerified: true, phoneVerified: false,
  loyaltyPoints: 0, createdAt: new Date(), updatedAt: new Date(),
};

it("links the account name to profile without a separate profile item", async () => {
  render(createElement(UserMenu, { user }));
  await userEvent.click(screen.getByRole("button", { name: "Open user menu" }));
  expect((await screen.findByRole("menuitem", { name: "Member — View profile" })).getAttribute("href")).toBe("/profile");
  expect(screen.queryByRole("menuitem", { name: "Profile" })).toBeNull();
  expect(screen.getAllByRole("menuitem")).toHaveLength(2);
  expect(screen.getByRole("menuitem", { name: "Sign out" })).toBeTruthy();
});

it("keeps the admin entry for super admins", async () => {
  render(createElement(UserMenu, { user: { ...user, role: "SUPER_ADMIN" } }));
  await userEvent.click(screen.getByRole("button", { name: "Open user menu" }));
  expect((await screen.findByRole("menuitem", { name: "Admin" })).getAttribute("href")).toBe("/admin/salons/verification");
  expect(screen.getAllByRole("menuitem")).toHaveLength(3);
});
