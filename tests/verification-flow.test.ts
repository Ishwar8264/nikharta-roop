// @vitest-environment jsdom
import { cloneElement, createElement as h, type ReactElement } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), submit: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => mocks }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("../src/features/verification/api", () => ({ submitVerificationApi: mocks.submit }));
vi.mock("../src/features/media", () => ({
  MediaPickerDialog: ({ trigger, onChange, disabled }: { trigger: ReactElement; onChange: (images: { url: string }[]) => void; disabled: boolean }) =>
    cloneElement(trigger as ReactElement<{ onClick: () => void; disabled: boolean }>, {
      disabled,
      onClick: () => onChange([{ url: "https://example.com/license.jpg" }]),
    }),
}));

import { VerificationPanel } from "../src/features/verification/verification-panel";
const initial = { status: "PENDING" as const, documents: [], submittedAt: null, reviewedAt: null, reason: null };

beforeAll(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Element.prototype.scrollIntoView = vi.fn();
});
beforeEach(() => { vi.clearAllMocks(); mocks.submit.mockResolvedValue({}); });
afterEach(cleanup);

describe("verification submission flow", () => {
  it("requires a document type, allows reviewing and going back, and submits the selected documents", async () => {
    const user = userEvent.setup();
    render(h(VerificationPanel, { salonSlug: "new-salon", initial, canSubmit: true }));
    expect((screen.getByRole("button", { name: "Review documents" }) as HTMLButtonElement).disabled).toBe(true);
    await user.click(screen.getByRole("button", { name: /Add documents/ }));
    await user.click(screen.getByRole("button", { name: "Review documents" }));
    expect(screen.getByText("Choose a type for each document before continuing.")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /Document type/ }));
    await user.click(screen.getByRole("option", { name: "Shop license" }));
    await user.click(screen.getByRole("button", { name: "Review documents" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Review documents" }));
    await user.click(screen.getByRole("button", { name: "Submit for review" }));
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalledOnce());
    expect(mocks.submit).toHaveBeenCalledWith("new-salon", { documents: [{ kind: "Shop license", url: "https://example.com/license.jpg" }] });
  });

  it("returns to management on cancel and hides submission controls from managers", async () => {
    const user = userEvent.setup();
    const view = render(h(VerificationPanel, { salonSlug: "new-salon", initial, canSubmit: true }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(mocks.push).toHaveBeenCalledWith("/salons/new-salon/manage");
    view.rerender(h(VerificationPanel, { salonSlug: "new-salon", initial, canSubmit: false }));
    expect(screen.queryByRole("button", { name: /Add documents/ })).toBeNull();
  });
});
