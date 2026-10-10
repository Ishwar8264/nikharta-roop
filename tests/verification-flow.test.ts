// @vitest-environment jsdom
import { createElement as h } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
  submit: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("../src/features/verification/api", () => ({
  submitVerificationApi: mocks.submit,
}));
vi.mock("../src/features/media", async () => ({
  MediaPickerDialog: (
    await import("../src/features/media/components/media-picker-dialog")
  ).MediaPickerDialog,
}));
vi.mock("../src/features/media/components/media-picker", () => ({
  MediaPicker: ({
    onChange,
    onUploadComplete,
  }: {
    onChange: (images: { url: string; publicId: string }[]) => void;
    onUploadComplete: () => void;
  }) =>
    h(
      "button",
      {
        onClick: () => {
          onChange([
            { url: "https://example.com/license.jpg", publicId: "license" },
          ]);
          onUploadComplete();
        },
      },
      "Finish upload",
    ),
}));

import { VerificationPanel } from "../src/features/verification/verification-panel";
const initial = {
  status: "PENDING" as const,
  documents: [],
  submittedAt: null,
  reviewedAt: null,
  reason: null,
};

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
beforeEach(() => {
  vi.clearAllMocks();
  mocks.submit.mockResolvedValue({});
});
afterEach(cleanup);

describe("verification submission flow", () => {
  it("requires a document type, allows reviewing and going back, and submits the selected documents", async () => {
    const user = userEvent.setup();
    render(
      h(VerificationPanel, {
        salonSlug: "new-salon", salonName: "Glow Salon 5",
        initial,
        canSubmit: true,
      }),
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Review documents",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    const uploadButton = screen
      .getAllByRole("button", { name: "Upload document" })
      .find((element) => element.tagName === "BUTTON")!;
    expect((uploadButton as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: /Document type/ }));
    await user.click(screen.getByRole("option", { name: "Shop license" }));
    expect((uploadButton as HTMLButtonElement).disabled).toBe(false);
    await user.click(uploadButton);
    expect(
      screen.getByRole("dialog", { name: "Upload shop license" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Finish upload" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Review documents" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Review documents" }));
    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
    expect(mocks.submit).toHaveBeenCalledWith("new-salon", {
      documents: [
        { kind: "Shop license", url: "https://example.com/license.jpg" },
      ],
    });
  });

  it("returns to management on cancel and hides submission controls from managers", async () => {
    const user = userEvent.setup();
    const view = render(
      h(VerificationPanel, {
        salonSlug: "new-salon", salonName: "Glow Salon 5",
        initial,
        canSubmit: true,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.push).toHaveBeenCalledWith("/salons/new-salon/manage");
    view.rerender(
      h(VerificationPanel, {
        salonSlug: "new-salon", salonName: "Glow Salon 5",
        initial,
        canSubmit: false,
      }),
    );
    expect(
      screen.queryByRole("button", { name: "Upload document" }),
    ).toBeNull();
  });

  it("opens the real replace dialog and removes an uploaded document", async () => {
    const user = userEvent.setup();
    render(
      h(VerificationPanel, {
        salonSlug: "new-salon", salonName: "Glow Salon 5",
        initial: {
          ...initial,
          documents: [{ kind: "PAN", url: "https://example.com/pan.jpg" }],
        },
        canSubmit: true,
      }),
    );
    const replace = screen
      .getAllByRole("button", { name: "Replace" })
      .find((element) => element.tagName === "BUTTON")!;
    await user.click(replace);
    expect(
      screen.getByRole("dialog", { name: "Replace document" }),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Finish upload" }));
    await user.click(screen.getByRole("button", { name: "Remove document" }));
    expect(
      screen.getByText("No documents added yet. Add at least one to continue."),
    ).toBeTruthy();
    expect(
      (
        screen.getByRole("button", {
          name: "Review documents",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
  });

  it("preserves review documents after a failed submission and allows retry", async () => {
    const user = userEvent.setup();
    mocks.submit.mockRejectedValueOnce(new Error("Network error"));
    render(
      h(VerificationPanel, {
        salonSlug: "new-salon", salonName: "Glow Salon 5",
        initial: {
          ...initial,
          documents: [{ kind: "PAN", url: "https://example.com/pan.jpg" }],
        },
        canSubmit: true,
      }),
    );
    await user.click(screen.getByRole("button", { name: "Review documents" }));
    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    expect(
      await screen.findByText("Could not submit documents. Please try again."),
    ).toBeTruthy();
    expect(mocks.refresh).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
  });
});
