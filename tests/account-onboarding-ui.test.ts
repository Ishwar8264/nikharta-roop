// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "../src/features/auth/shared/types";

const mocks = vi.hoisted(() => ({
  patch: vi.fn(),
  post: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock("../src/lib/api/backend.client", async (original) => ({
  ...(await original<object>()),
  api: { patch: mocks.patch, post: mocks.post },
}));
import { OnboardingForm } from "../src/features/onboarding/onboarding-form";
import { ApiError } from "../src/lib/api/backend.client";
import { PARTNER_TERMS_VERSION } from "../src/features/onboarding/policy";

const user: CurrentUser = {
  id: "user",
  name: "Customer",
  email: "user@example.test",
  phone: null,
  avatar: null,
  coverImage: null,
  bio: null,
  lat: null,
  lng: null,
  role: "USER",
  isOnboarded: false,
  emailVerified: true,
  phoneVerified: false,
  loyaltyPoints: 0,
  accountType: null,
  onboardingCompletedAt: null,
  partnerCompletedAt: null,
  partnerTermsVersion: null,
  partnerTermsAcceptedAt: null,
  partnerEligibilityBackfilledAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

function setup(partnerRequested = false) {
  render(
    createElement(OnboardingForm, {
      user,
      partnerRequested,
      destination: "/salons/example/book",
    }),
  );
  return userEvent.setup();
}

describe("skip-friendly account setup", () => {
  it("requires an explicit choice but lets undecided users skip to booking", async () => {
    const actor = setup();
    expect(
      (screen.getByRole("button", { name: "Continue" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);
    await actor.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(mocks.patch).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
    expect(mocks.replace).toHaveBeenCalledWith("/salons/example/book");
  });
  it("saves selected partner intent on skip without completing consent", async () => {
    const actor = setup();
    await actor.click(screen.getByRole("radio", { name: /Salon partner/ }));
    await actor.click(screen.getByRole("button", { name: "Skip for now" }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalled());
    expect(mocks.patch).toHaveBeenCalledWith("/auth/onboarding", {
      accountType: "SALON_PARTNER",
      name: "Customer",
    });
    expect(mocks.post).not.toHaveBeenCalled();
  });
  it("requires phone and both confirmations, then starts salon creation", async () => {
    const actor = setup(true);
    const button = screen.getByRole("button", {
      name: /Complete & add salon/,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await actor.type(
      screen.getByLabelText(/Business contact phone/),
      "+919876543210",
    );
    await actor.click(
      screen.getByRole("checkbox", { name: /I own the salon/ }),
    );
    expect(button.disabled).toBe(true);
    await actor.click(screen.getByRole("checkbox", { name: /I accept/ }));
    expect(button.disabled).toBe(false);
    expect(
      Number(screen.getByRole("progressbar").getAttribute("aria-valuenow")),
    ).toBeLessThan(100);
    await actor.click(button);
    await waitFor(() =>
      expect(mocks.replace).toHaveBeenCalledWith("/salons/create"),
    );
    expect(mocks.post).toHaveBeenCalledWith(
      "/auth/onboarding",
      expect.objectContaining({
        accountType: "SALON_PARTNER",
        authorised: true,
        acceptTerms: true,
        termsVersion: PARTNER_TERMS_VERSION,
      }),
    );
  });
  it("retains details and shows a field error after a rejected save", async () => {
    mocks.post.mockRejectedValue(
      new ApiError(409, "Phone already in use", {
        errors: [{ field: "phone", message: "Choose another phone number" }],
      }),
    );
    const actor = setup(true);
    const phone = screen.getByLabelText(
      /Business contact phone/,
    ) as HTMLInputElement;
    await actor.type(phone, "+919876543210");
    await actor.click(
      screen.getByRole("checkbox", { name: /I own the salon/ }),
    );
    await actor.click(screen.getByRole("checkbox", { name: /I accept/ }));
    await actor.click(
      screen.getByRole("button", { name: /Complete & add salon/ }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toBe(
        "Phone already in use",
      ),
    );
    expect(phone.value).toBe("+919876543210");
    expect(screen.getByText("Choose another phone number")).toBeTruthy();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});
