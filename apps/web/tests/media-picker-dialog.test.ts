// @vitest-environment jsdom
import { createElement as h } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button } from "../src/components/ui/button";
import { MediaPickerDialog } from "../src/features/media/components/media-picker-dialog";

vi.mock("../src/features/media/components/media-picker", () => ({
  MediaPicker: () => h("p", null, "Upload files here"),
}));
vi.mock("../src/features/media/components/upload-pane", () => ({
  UploadPane: () => null,
}));
afterEach(cleanup);

describe("media picker trigger", () => {
  it("opens from the shared button and closes with Escape", async () => {
    const user = userEvent.setup();
    render(
      h(MediaPickerDialog, {
        title: "Upload documents",
        value: [],
        onChange: vi.fn(),
        trigger: h(Button, null, "Upload document"),
      }),
    );
    await user.click(
      screen
        .getAllByRole("button", { name: "Upload document" })
        .find((element) => element.tagName === "BUTTON")!,
    );
    expect(
      screen.getByRole("dialog", { name: "Upload documents" }),
    ).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it.each(["{Enter}", " "])(
    "opens from a focused shared button with %s",
    async (key) => {
      const user = userEvent.setup();
      render(
        h(MediaPickerDialog, {
          title: "Upload documents",
          value: [],
          onChange: vi.fn(),
          trigger: h(Button, null, "Upload document"),
        }),
      );
      const button = screen
        .getAllByRole("button", { name: "Upload document" })
        .find((element) => element.tagName === "BUTTON")!;
      button.focus();
      await user.keyboard(key);
      expect(
        screen.getByRole("dialog", { name: "Upload documents" }),
      ).toBeTruthy();
    },
  );

  it("keeps a disabled picker closed", async () => {
    const user = userEvent.setup();
    render(
      h(MediaPickerDialog, {
        title: "Upload documents",
        disabled: true,
        value: [],
        onChange: vi.fn(),
        trigger: h(Button, { disabled: true }, "Upload document"),
      }),
    );
    const wrapper = screen
      .getAllByRole("button", { name: "Upload document" })
      .find((element) => element.tagName === "SPAN")!;
    await user.click(wrapper);
    wrapper.focus();
    await user.keyboard("{Enter}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
