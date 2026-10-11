// @vitest-environment jsdom
import { createElement } from "react";
import { beforeAll, afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { CurrentUser } from "../src/features/auth/shared/types";

import { intlTelInput } from "@intl-tel-input/react";

beforeAll(async () => {
  await intlTelInput.attachUtils(() => import("intl-tel-input/utils"));
});

const mocks = vi.hoisted(() => ({
  patch: vi.fn(),
  post: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  auth: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
  usePathname: () => "/salons",
}));
vi.mock("../src/lib/api/backend.client", async (original) => ({
  ...(await original<object>()),
  api: { patch: mocks.patch, post: mocks.post },
}));
vi.mock("../src/features/auth/components/authProvider", () => ({
  useAuth: mocks.auth,
}));
import { OnboardingReminder } from "../src/features/onboarding/onboarding-reminder";
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
  window.history.replaceState(null, "", "/");
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
  it("cleans entry parameters while preserving the current booking destination", async () => {
    window.history.replaceState(null, "", "/onboarding?welcome=1&redirect=%2Fsalons%2Fexample%2Fbook");
    const actor = setup();
    expect(window.location.pathname + window.location.search).toBe("/onboarding");
    await actor.click(screen.getByRole("radio", { name: /Customer/ }));
    await actor.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByLabelText(/Your name/)).toBeTruthy());
    expect(mocks.refresh).not.toHaveBeenCalled();
    await actor.click(screen.getByRole("button", { name: /Start exploring/ }));
    await waitFor(() => expect(mocks.replace).toHaveBeenCalledWith("/salons/example/book"));
  });
  it("cleans partner entry parameters without changing the selected flow", () => {
    window.history.replaceState(null, "", "/onboarding?welcome=1&type=partner");
    setup(true);
    expect(window.location.pathname + window.location.search).toBe("/onboarding");
    expect(screen.getByLabelText(/Business contact phone/)).toBeTruthy();
  });
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
    expect(screen.getByRole("button", { name: /India/ })).toBeTruthy();
    const button = screen.getByRole("button", {
      name: /Complete & add salon/,
    }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    await actor.type(
      screen.getByLabelText(/Business contact phone/),
      "9876543210",
    );
    await actor.click(
      screen.getByRole("checkbox", { name: /I own the salon/ }),
    );
    expect(button.disabled).toBe(true);
    await actor.click(screen.getByRole("checkbox", { name: /I accept/ }));
    expect(button.disabled).toBe(false);
    expect(screen.getByText("Step 2 of 2 · Account setup")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
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
  it("shows phone feedback on blur and adds the selected country code", async () => {
    const actor = setup(true);
    const phone = screen.getByLabelText(/Business contact phone/);
    await actor.type(phone, "123");
    await actor.tab();
    expect(screen.getByText("Use an international phone number, e.g. +919876543210")).toBeTruthy();
    expect(phone.getAttribute("aria-invalid")).toBe("true");
    await actor.clear(phone);
    await actor.type(phone, "9876543210");
    expect(phone.getAttribute("aria-invalid")).toBeNull();
    await actor.click(screen.getByRole("checkbox", { name: /I own the salon/ }));
    await actor.click(screen.getByRole("checkbox", { name: /I accept/ }));
    await actor.click(screen.getByRole("button", { name: /Complete & add salon/ }));
    await waitFor(() => expect(mocks.post).toHaveBeenCalledWith(
      "/auth/onboarding", expect.objectContaining({ phone: "+919876543210" }),
    ));
  });
  it("shows name feedback on blur and clears it after correction", async () => {
    const actor = setup(true);
    const name = screen.getByLabelText(/Your name/);
    await actor.clear(name);
    await actor.type(name, "A");
    await actor.tab();
    expect(screen.getByText("Name must contain at least 2 characters")).toBeTruthy();
    await actor.type(name, "n");
    expect(screen.queryByText("Name must contain at least 2 characters")).toBeNull();
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
    await actor.type(phone, "9876543210");
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
    expect(phone.value.replace(/\D/g, "")).toBe("9876543210");
    expect(screen.getByText("Choose another phone number")).toBeTruthy();
    expect(mocks.replace).not.toHaveBeenCalled();
  });
});

describe("account setup reminder", () => {
  it("hides incomplete setup reminders for super admins", () => {
    mocks.auth.mockReturnValue({ user: { ...user, role: "SUPER_ADMIN" } });
    render(createElement(OnboardingReminder));
    expect(screen.queryByRole("complementary")).toBeNull();
  });
  it("keeps reminders for incomplete customers", () => {
    mocks.auth.mockReturnValue({ user });
    render(createElement(OnboardingReminder));
    expect(screen.getByRole("complementary", { name: "Account setup reminder" })).toBeTruthy();
  });
});
