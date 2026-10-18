// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserTypeBadge } from "../src/components/shared/user-type-badge";
afterEach(cleanup);
it("shows actual membership roles once without calling a partner an owner", () => {
  const view = render(createElement(UserTypeBadge, { role: "USER", accountType: "SALON_PARTNER" }));
  expect(screen.getByText("Salon partner")).toBeTruthy();
  expect(screen.queryByText("Owner")).toBeNull();
  view.rerender(createElement(UserTypeBadge, { role: "USER", salonRoles: ["OWNER", "OWNER", "STAFF"] }));
  expect(screen.getAllByText("Owner")).toHaveLength(1);
  expect(screen.getByText("Staff")).toBeTruthy();
});
it("explains the admin badge on keyboard focus", async () => {
  render(createElement(UserTypeBadge, { role: "SUPER_ADMIN" }));
  expect(screen.getByText("Admin")).toBeTruthy();
  await userEvent.tab();
  expect((await screen.findByRole("tooltip")).textContent).toBe("You have platform administration access.");
});
