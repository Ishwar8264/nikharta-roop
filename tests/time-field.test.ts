// @vitest-environment jsdom
import { createElement, useState } from "react";
import { afterEach, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TimeField } from "../src/components/ui/time-field";
afterEach(cleanup);
function Example() {
  const [value, setValue] = useState("09:30");
  return createElement("div", null, createElement(TimeField, { value, onChange: setValue, label: "Start time" }), createElement("output", null, value));
}
it("edits hours and AM/PM with arrow keys while preserving 24-hour API values", async () => {
  const user = userEvent.setup();
  render(createElement(Example));
  const segments = screen.getAllByRole("spinbutton");
  segments[0].focus();
  await user.keyboard("{ArrowUp}");
  expect(screen.getByRole("status").textContent).toBe("10:30");
  segments[2].focus();
  await user.keyboard("{ArrowUp}");
  expect(screen.getByRole("status").textContent).toBe("22:30");
});
it("hydrates when server Intl uses narrow spaces and the browser uses regular spaces", async () => {
  const { renderToString } = await import("react-dom/server");
  const { hydrateRoot } = await import("react-dom/client");
  const { act } = await import("@testing-library/react");
  const { vi } = await import("vitest");
  const original = Intl.DateTimeFormat.prototype.formatToParts;
  const node = createElement(TimeField, { value: "09:30", onChange: () => {}, label: "Hydration time" });
  const serverFormat = vi.spyOn(Intl.DateTimeFormat.prototype, "formatToParts").mockImplementation(function (this: Intl.DateTimeFormat, value) {
    return original.call(this, value).map((part) => part.type === "literal" ? { ...part, value: part.value.replace(/\s/gu, "\u202f") } : part);
  });
  const container = document.createElement("div");
  try { container.innerHTML = renderToString(node); }
  finally { serverFormat.mockRestore(); }
  document.body.appendChild(container);
  const browserFormat = vi.spyOn(Intl.DateTimeFormat.prototype, "formatToParts").mockImplementation(function (this: Intl.DateTimeFormat, value) {
    return original.call(this, value).map((part) => part.type === "literal" ? { ...part, value: part.value.replace(/\s/gu, " ") } : part);
  });
  const recoverable = vi.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => { root = hydrateRoot(container, node, { onRecoverableError: recoverable }); });
    expect(recoverable).not.toHaveBeenCalled();
    for (const segment of container.querySelectorAll('[data-type="literal"]')) {
      expect(segment.textContent).not.toContain("\u202f");
    }
  } finally {
    await act(async () => root?.unmount());
    browserFormat.mockRestore();
    container.remove();
  }
});
