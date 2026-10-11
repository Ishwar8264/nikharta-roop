// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ProfileLayout from "../src/app/(dashboard)/layout";
const mocks = vi.hoisted(() => ({ session: vi.fn(), memberships: vi.fn() }));
vi.mock("../src/lib/auth/get-session", () => ({ getSession: mocks.session }));
vi.mock("../src/server/modules/salon/salon.repository", () => ({ listUserSalonMemberships: mocks.memberships }));
vi.mock("../src/components/layout/header", () => ({ Header: () => null }));
vi.mock("../src/components/layout/footer", () => ({ Footer: () => null }));
vi.mock("next/navigation", () => ({ usePathname: () => "/profile" }));
vi.mock("next/link", async (original) => ({ ...(await original<object>()), useLinkStatus: () => ({ pending: false }) }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

it("shows account shortcuts and keeps the profile active", async () => {
  mocks.session.mockResolvedValue({ id: "u", role: "USER" });
  mocks.memberships.mockResolvedValue([]);
  render(await ProfileLayout({ children: "Profile content" }));
  expect(screen.getByRole("link", { name: "Profile" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("link", { name: "Appointments" }).getAttribute("href")).toBe("/appointments");
  expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
});

it("uses permitted salon destinations and includes admin access for super admins", async () => {
  mocks.session.mockResolvedValue({ id: "u", role: "SUPER_ADMIN" });
  mocks.memberships.mockResolvedValue([
    { role: "OWNER", salon: { id: "o", name: "Owned", slug: "owned", isActive: false } },
    { role: "MANAGER", salon: { id: "m", name: "Managed", slug: "managed", isActive: true } },
    { role: "STAFF", salon: { id: "s", name: "Staff Salon", slug: "staff", isActive: true } },
    { role: "STAFF", salon: { id: "p", name: "Private", slug: "private", isActive: false } },
  ]);
  render(await ProfileLayout({ children: "Profile content" }));
  expect(screen.getByRole("link", { name: /Owned/ }).getAttribute("href")).toBe("/salons/owned/manage");
  expect(screen.getByRole("link", { name: /Managed/ }).getAttribute("href")).toBe("/salons/managed/manage");
  expect(screen.getByRole("link", { name: /Staff Salon/ }).getAttribute("href")).toBe("/salons/staff");
  expect(screen.queryByRole("link", { name: /Private/ })).toBeNull();
  expect(screen.getByRole("link", { name: "Admin" }).getAttribute("href")).toBe("/admin/salons/verification");
});
