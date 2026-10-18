// @vitest-environment jsdom
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserTypeBadge } from "../src/components/shared/user-type-badge";
import ProfileError from "../src/app/(dashboard)/profile/error";

it("server renders the badge with the real tooltip exports", () => {
  const html = renderToString(createElement(UserTypeBadge, { role: "SUPER_ADMIN" }));
  expect(html).toContain("Super admin");
  expect(html).toContain("button");
});

it("renders the profile recovery screen and retries", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const reset = vi.fn();
  try {
    render(createElement(ProfileError, { error: new Error("Profile failed"), reset }));
    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(reset).toHaveBeenCalledOnce();
  } finally {
    consoleError.mockRestore();
  }
});
