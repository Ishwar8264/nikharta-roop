import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock("../src/features/media", () => ({ MediaPickerDialog: () => null }));

import { VerificationPanel } from "../src/features/verification/verification-panel";
import type { SalonVerification } from "../src/features/verification/api";

const initial: SalonVerification = {
  status: "PENDING", documents: [], submittedAt: null, reviewedAt: null, reason: null,
};

describe("verification onboarding messages", () => {
  it("asks a new owner to submit documents rather than claiming review has started", () => {
    const html = renderToStaticMarkup(createElement(VerificationPanel, { salonSlug: "new-salon", initial, canSubmit: true }));
    expect(html).toContain("Salon created");
    expect(html).toContain("Submit your documents for approval.");
    expect(html).toContain("Verification documents");
    expect(html).not.toContain("reviewing your documents");
  });

  it("shows the review status only after documents have been submitted", () => {
    const html = renderToStaticMarkup(createElement(VerificationPanel, { salonSlug: "new-salon", initial: { ...initial, submittedAt: "2026-10-10T09:00:00.000Z" }, canSubmit: true }));
    expect(html).toContain("reviewing your documents");
    expect(html).not.toContain("Salon created");
    expect(html).not.toContain("Verification documents");
  });
});
