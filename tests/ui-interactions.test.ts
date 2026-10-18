// @vitest-environment jsdom
import { createElement as h, useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SelectField } from "../src/components/shared/select-field";
import { Button } from "../src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "../src/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../src/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverTitle,
} from "../src/components/ui/popover";
import { Switch } from "../src/components/ui/switch";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../src/components/ui/tabs";
import { Toggle } from "../src/components/ui/toggle";
import { ToolbarButton } from "../src/components/ui/minimal-tiptap/components/toolbar-button";
import { Input } from "../src/components/ui/input";
import { Slider } from "../src/components/ui/slider";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "../src/components/ui/toggle-group";

beforeAll(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

describe("React Aria component migration", () => {
  it("shows readable select labels and changes the controlled value by keyboard", async () => {
    function Field() {
      const [value, setValue] = useState<string | null>("UNISEX");
      return h(SelectField, {
        label: "Category",
        options: [
          { value: "UNISEX", label: "Unisex" },
          { value: "MALE", label: "Men only" },
        ],
        value,
        onValueChange: setValue,
      });
    }
    const user = userEvent.setup();
    render(h(Field));
    const trigger = screen.getByRole("button", { name: /Category/ });
    expect(trigger.textContent).toContain("Unisex");
    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeTruthy();
    await user.keyboard("{ArrowDown}{Enter}");
    await waitFor(() => expect(trigger.textContent).toContain("Men only"));
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("links select errors and disables unavailable options", async () => {
    const user = userEvent.setup();
    render(
      h(SelectField, {
        id: "category",
        label: "Category",
        error: "Choose a category",
        description: "Choose your audience",
        options: [
          { value: "a", label: "Available" },
          { value: "b", label: "Disabled", disabled: true },
        ],
        value: "a",
      }),
    );
    const trigger = screen.getByRole("button", { name: /Category/ });
    expect(trigger.getAttribute("data-invalid")).toBe("true");
    expect(trigger.getAttribute("aria-describedby")).toContain(
      "category-error",
    );
    await user.click(trigger);
    expect(
      screen
        .getByRole("option", { name: "Disabled" })
        .getAttribute("aria-disabled"),
    ).toBe("true");
  });

  it("opens rendered dialog triggers, dismisses with Escape and restores focus", async () => {
    const user = userEvent.setup();
    render(
      h(
        Dialog,
        null,
        h(
          DialogTrigger,
          { render: h(Button, { variant: "outline" }) },
          "Open dialog",
        ),
        h(DialogContent, null, h(DialogTitle, null, "Review changes")),
      ),
    );
    const trigger = screen.getByRole("button", { name: "Open dialog" });
    await user.click(trigger);
    expect(screen.getByRole("dialog", { name: "Review changes" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it("runs menu actions once and closes after selection", async () => {
    const action = vi.fn();
    const user = userEvent.setup();
    render(
      h(
        DropdownMenu,
        null,
        h(DropdownMenuTrigger, { render: h(Button) }, "Actions"),
        h(
          DropdownMenuContent,
          null,
          h(DropdownMenuItem, { onAction: action }, "Apply"),
        ),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Apply" }));
    expect(action).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("opens and dismisses a rendered popover trigger", async () => {
    const user = userEvent.setup();
    render(
      h(
        Popover,
        null,
        h(PopoverTrigger, { render: h(Button) }, "Edit link"),
        h(PopoverContent, null, h(PopoverTitle, null, "Link settings")),
      ),
    );
    await user.click(screen.getByRole("button", { name: "Edit link" }));
    expect(screen.getByRole("dialog", { name: "Link settings" })).toBeTruthy();
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("preserves legacy switch, toggle, group and tab callbacks", async () => {
    const checked = vi.fn(),
      pressed = vi.fn(),
      selected = vi.fn(),
      tab = vi.fn();
    const user = userEvent.setup();
    render(
      h(
        "div",
        null,
        h(Switch, { "aria-label": "Notifications", onCheckedChange: checked }),
        h(Toggle, { onPressedChange: pressed }, "Bold"),
        h(
          ToggleGroup,
          { onValueChange: selected, "aria-label": "Alignment" },
          h(ToggleGroupItem, { value: "left" }, "Left"),
        ),
        h(
          Tabs,
          { defaultValue: "first", onValueChange: tab },
          h(
            TabsList,
            { "aria-label": "Details" },
            h(TabsTrigger, { value: "first" }, "First"),
            h(TabsTrigger, { value: "second" }, "Second"),
          ),
          h(TabsContent, { value: "first" }, "First panel"),
          h(TabsContent, { value: "second" }, "Second panel"),
        ),
      ),
    );
    await user.click(screen.getByRole("switch", { name: "Notifications" }));
    expect(checked).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole("button", { name: "Bold" }));
    expect(pressed).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole("radio", { name: "Left" }));
    expect(selected).toHaveBeenCalledWith(["left"]);
    await user.click(screen.getByRole("tab", { name: "Second" }));
    expect(tab).toHaveBeenCalledWith("second");
    expect(screen.getByRole("tabpanel").textContent).toBe("Second panel");
  });
});

it("opens editor menus and popovers from toolbar toggles with tooltips", async () => {
  const user = userEvent.setup();
  render(
    h(
      "div",
      null,
      h(
        DropdownMenu,
        null,
        h(DropdownMenuTrigger, {
          render: h(ToolbarButton, {
            tooltip: "Styles",
            "aria-label": "Styles",
          }),
        }),
        h(DropdownMenuContent, null, h(DropdownMenuItem, null, "Paragraph")),
      ),
      h(
        Popover,
        null,
        h(PopoverTrigger, {
          render: h(ToolbarButton, {
            tooltip: "Link",
            "aria-label": "Insert link",
          }),
        }),
        h(PopoverContent, null, h(PopoverTitle, null, "Link")),
      ),
    ),
  );
  await user.click(screen.getByRole("button", { name: "Styles" }));
  expect(screen.getByRole("menuitem", { name: "Paragraph" })).toBeTruthy();
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Insert link" }));
  expect(screen.getByRole("dialog", { name: "Link" })).toBeTruthy();
});

it("preserves native input form events and submission", async () => {
  const change = vi.fn(),
    submit = vi.fn((event) => event.preventDefault());
  const user = userEvent.setup();
  render(
    h(
      "form",
      { onSubmit: submit },
      h(Input, { "aria-label": "Salon name", name: "name", onChange: change }),
      h(Button, { type: "submit" }, "Save"),
    ),
  );
  await user.type(screen.getByRole("textbox"), "Salon");
  expect(change).toHaveBeenCalledTimes(5);
  await user.click(screen.getByRole("button", { name: "Save" }));
  expect(submit).toHaveBeenCalledTimes(1);
});

it("updates slider array values with the keyboard", async () => {
  const change = vi.fn();
  const user = userEvent.setup();
  render(
    h(Slider, {
      "aria-label": "Image width",
      defaultValue: [50],
      min: 0,
      max: 100,
      onValueChange: change,
    }),
  );
  const slider = screen.getByRole("slider");
  slider.focus();
  await user.keyboard("{ArrowRight}");
  expect(change).toHaveBeenCalledWith([51]);
});
