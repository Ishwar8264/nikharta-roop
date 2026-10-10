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
import { REVIEW_CHECKS } from "../src/features/verification/policy";
const mock = vi.hoisted(() => ({ review: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mock.refresh }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("../src/features/verification/api", () => ({
  reviewVerificationApi: mock.review,
}));
import { AdminReviewSheet } from "../src/features/verification/admin-review-sheet";
const verification = {
  status: "PENDING" as const,
  submittedAt: "2026-10-10T10:00:00.000Z",
  updatedAt: "2026-10-10T10:00:00.000Z",
  reviewedAt: null,
  reason: null,
  documents: ["PAN", "Shop license", "Salon photo 1", "Salon photo 2"].map(
    (kind, index) => ({
      kind,
      mediaId: String(index + 1).repeat(48),
      url: `/api/v1/salons/salon/verification/documents/${String(index + 1).repeat(48)}`,
    }),
  ),
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
  mock.review.mockResolvedValue({});
});
afterEach(cleanup);
describe("admin evidence gate", () => {
  it("keeps publication disabled until all evidence is supplied and sends the reviewed version", async () => {
    const user = userEvent.setup();
    render(
      h(AdminReviewSheet, {
        salon: {
          slug: "salon",
          name: "Salon",
          address: "123 Main Road",
          city: "Mumbai",
        },
        verification,
        open: true,
        onOpenChange: vi.fn(),
      }),
    );
    await user.click(
      screen.getByRole("button", { name: /Approve Publish the salon/ }),
    );
    const approve = screen.getByRole("button", {
      name: "Approve",
    }) as HTMLButtonElement;
    expect(approve.disabled).toBe(true);
    for (const check of REVIEW_CHECKS)
      await user.click(screen.getByLabelText(check.label));
    expect(approve.disabled).toBe(true);
    await user.click(
      screen.getByRole("button", { name: /Identity verification source/ }),
    );
    await user.click(screen.getByRole("option", { name: "Income Tax" }));
    await user.type(
      screen.getByLabelText(/Identity lookup reference/),
      "LOOKUP-123",
    );
    await user.type(
      screen.getByLabelText(/Business issuing authority/),
      "Municipal authority",
    );
    await user.type(
      screen.getByLabelText(/Business lookup reference/),
      "CERT-123",
    );
    await user.type(
      screen.getByLabelText(/Review notes/),
      "Official identity and business records checked; owner authority, address and premises photos matched.",
    );
    expect(approve.disabled).toBe(false);
    await user.click(approve);
    await waitFor(() => expect(mock.refresh).toHaveBeenCalledOnce());
    expect(mock.review).toHaveBeenCalledWith(
      "salon",
      expect.objectContaining({
        status: "VERIFIED",
        expectedUpdatedAt: verification.updatedAt,
        evidence: expect.objectContaining({
          identityVerified: true,
          identitySource: "Income Tax",
        }),
      }),
    );
  });
  it("blocks approval of legacy public-image submissions", async () => {
    const user = userEvent.setup();
    render(
      h(AdminReviewSheet, {
        salon: { slug: "salon", name: "Salon" },
        verification: {
          ...verification,
          documents: [{ kind: "PAN", url: "https://example.com/fake.jpg" }],
        },
        open: true,
        onOpenChange: vi.fn(),
      }),
    );
    await user.click(
      screen.getByRole("button", { name: /Approve Publish the salon/ }),
    );
    expect(
      (screen.getByRole("button", { name: "Approve" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    expect(
      screen.getByText(/Reject it with instructions to resubmit/),
    ).toBeTruthy();
    expect(mock.review).not.toHaveBeenCalled();
  });
});
