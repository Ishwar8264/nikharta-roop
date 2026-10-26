import { expect, it } from "vitest";
import { getPostLoginDestination } from "../src/features/auth/login/hooks/useLogin";
import { createOtpEmail } from "../src/lib/email/auth-email.template";
it("returns to the staff profile after a manual staff login without onboarding", () => {
  expect(getPostLoginDestination("?flow=staff&redirect=%2Fsalons%2Fglow-salon%2Fstaff%2Fpriya")).toBe("/salons/glow-salon/staff/priya");
});
it("rejects external and protocol-relative staff login destinations", () => {
  for (const redirect of ["https://evil.example", "//evil.example", "/salons/create"]) {
    expect(getPostLoginDestination("?flow=staff&redirect=" + encodeURIComponent(redirect))).toBe("/salons");
  }
});
it("preserves ordinary login onboarding and provides an account fallback for staff", () => {
  expect(getPostLoginDestination("")).toBe("/onboarding?welcome=1");
  expect(getPostLoginDestination("?flow=staff")).toBe("/profile");
});
it("emails activation-only links even for members who already have passwords", () => {
  const email = createOtpEmail("123456", "staff@example.com", false, true);
  expect(email.text).toContain("sent=1&flow=staff");
  expect(email.text).not.toContain("setup=1");
});
