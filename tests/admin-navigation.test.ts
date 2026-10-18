// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { AdminNavigation } from "../src/features/admin/admin-navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/admin/users" }));
vi.mock("next/link", async (original) => ({
  ...(await original<object>()),
  useLinkStatus: () => ({ pending: false }),
}));
afterEach(cleanup);

it("marks only the current admin destination as active", () => {
  render(createElement(AdminNavigation));
  const nav = screen.getByRole("navigation", { name: "Admin navigation" });
  expect(within(nav).getByRole("link", { name: /Users/ }).getAttribute("aria-current")).toBe("page");
  expect(within(nav).getByRole("link", { name: /Salon verification/ }).getAttribute("aria-current")).toBeNull();
  expect(within(nav).getAllByRole("link")).toHaveLength(5);
});
