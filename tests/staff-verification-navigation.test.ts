// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "../src/lib/api/backend.client";
const mocks = vi.hoisted(() => ({ query: "", push: vi.fn(), send: vi.fn(), verify: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(mocks.query), useRouter: () => ({ push: mocks.push }) }));
vi.mock("../src/features/auth/verify-otp/api/sendOtp", () => ({ sendOtpApi: mocks.send }));
vi.mock("../src/features/auth/verify-otp/api/verifyOtp", () => ({ verifyOtpApi: mocks.verify }));
import { VerifyOtpForm } from "../src/features/auth/verify-otp/components/verifyOtpForm";
import { StaffVerificationNotice } from "../src/features/staff/staff-verification-notice";
afterEach(cleanup);
beforeEach(() => { vi.resetAllMocks(); mocks.query = ""; });
it("keeps the owner on the member page after sending the activation email", async () => {
  const user = userEvent.setup();
  mocks.send.mockResolvedValue({});
  render(createElement(StaffVerificationNotice, { email: "staff+salon@example.com" }));
  expect(screen.queryByRole("link", { name: "Enter verification code" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Resend email" }));
  expect((await screen.findByRole("status")).textContent).toContain("Activation email sent");
  expect(mocks.send).toHaveBeenCalledWith({ email: "staff+salon@example.com", staffActivation: true });
  expect(mocks.push).not.toHaveBeenCalled();
});
it("stays on the member page when resend fails", async () => {
  mocks.send.mockRejectedValue(new ApiError(429, "Try again later"));
  const user = userEvent.setup();
  render(createElement(StaffVerificationNotice, { email: "staff@example.com" }));
  await user.click(screen.getByRole("button", { name: "Resend email" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Try again later");
  expect(mocks.push).not.toHaveBeenCalled();
});
it("allows entering an email when verification is opened without a query", () => {
  render(createElement(VerifyOtpForm));
  const input = screen.getByLabelText(/Email address/);
  expect(input.getAttribute("name")).toBe("email");
  expect(input.closest("form")?.getAttribute("action")).toBe("/verify-otp");
});
it("opens code entry for an already sent OTP without sending another email", () => {
  mocks.query = "email=staff%40example.com&sent=1";
  render(createElement(VerifyOtpForm));
  expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Verify email" })).toBeTruthy();
  expect(mocks.send).not.toHaveBeenCalled();
});
it("preserves the password setup flow for new staff invitations", () => {
  mocks.query = "email=staff%40example.com&setup=1";
  render(createElement(VerifyOtpForm));
  expect(screen.getByLabelText(/Create your password/)).toBeTruthy();
});

it("finishes staff activation without redirecting or creating a login session", async () => {
  const user = userEvent.setup();
  mocks.query = "email=staff%40example.com&sent=1&flow=staff";
  mocks.verify.mockRejectedValueOnce(new ApiError(422, "Choose a password")).mockResolvedValueOnce({ data: { staffProfileUrl: "/salons/glow-salon/staff/priya" } });
  render(createElement(VerifyOtpForm));
  const digits = screen.getAllByRole("textbox");
  for (const [index, input] of digits.entries()) await user.type(input, String(index + 1));
  await user.click(screen.getByRole("button", { name: "Verify email" }));
  const password = await screen.findByLabelText(/Create your password/);
  await user.type(password, "StrongPassword123");
  await user.click(screen.getByRole("button", { name: "Verify email" }));
  expect(await screen.findByRole("heading", { name: "Email verified" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Sign in" }).getAttribute("href")).toBe("/login?flow=staff&redirect=%2Fsalons%2Fglow-salon%2Fstaff%2Fpriya");
  expect(mocks.verify).toHaveBeenLastCalledWith({ email: "staff@example.com", code: "123456", newPassword: "StrongPassword123", createSession: false });
  expect(mocks.push).not.toHaveBeenCalled();
});
