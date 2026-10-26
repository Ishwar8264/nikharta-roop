// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { UserBadge } from "../src/components/shared/user-badge";
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const props = { name: "Ishwar Kumar", avatar: "/avatar.jpg", avatarAlt: "Profile photo" };

it("removes initials when the avatar loads and restores them after an error", () => {
  render(createElement(UserBadge, props));
  expect(screen.getByText("IK")).toBeTruthy();
  const image = screen.getByRole("img", { name: "Profile photo" });
  fireEvent.load(image);
  expect(screen.queryByText("IK")).toBeNull();
  fireEvent.error(image);
  expect(screen.getByText("IK")).toBeTruthy();
});

it("hides initials for an already cached image", () => {
  vi.spyOn(HTMLImageElement.prototype, "complete", "get").mockReturnValue(true);
  vi.spyOn(HTMLImageElement.prototype, "naturalWidth", "get").mockReturnValue(100);
  render(createElement(UserBadge, props));
  expect(screen.queryByText("IK")).toBeNull();
});

it("resets the fallback when the avatar source changes", () => {
  const view = render(createElement(UserBadge, props));
  fireEvent.load(screen.getByRole("img", { name: "Profile photo" }));
  view.rerender(createElement(UserBadge, { ...props, avatar: "/new-avatar.jpg" }));
  expect(screen.getByText("IK")).toBeTruthy();
  fireEvent.load(screen.getByRole("img", { name: "Profile photo" }));
  expect(screen.queryByText("IK")).toBeNull();
});
