import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(), verify: vi.fn(), issue: vi.fn(), email: vi.fn(), log: vi.fn(), logError: vi.fn(),
}));
vi.mock("../src/lib/prisma", () => ({ prisma: {} }));
vi.mock("../src/lib/rate-limit", () => ({ redis: undefined }));
vi.mock("../src/lib/email", () => ({ sendLoginLockoutEmail: mocks.email }));
vi.mock("../src/server/auth/password", () => ({ verifyPassword: mocks.verify, hashPassword: vi.fn() }));
vi.mock("../src/server/auth/token.service", () => ({ issueTokenPair: mocks.issue, issueTokenPairInTransaction: vi.fn(), hashRefreshToken: vi.fn() }));
vi.mock("../src/server/auth/auth.logger", () => ({ logAuthEvent: mocks.log, logAuthError: mocks.logError }));
vi.mock("../src/server/modules/otp/otp.service", () => ({ sendOtp: vi.fn() }));
vi.mock("../src/server/modules/auth/auth.repository", () => ({
  findUserForLogin: mocks.findUser, createUser: vi.fn(), findActiveSessionByHash: vi.fn(),
  findActiveSessions: vi.fn(), findExistingIdentifiers: vi.fn(), findUserById: vi.fn(),
  findUserWithPasswordById: vi.fn(), revokeActiveSessionById: vi.fn(), updateUserProfile: vi.fn(),
}));
import { loginUser } from "../src/server/modules/auth/auth.service";
import { POST } from "../src/app/api/v1/auth/login/route";
import { clearLockout, recordFailedAttempt } from "../src/server/auth/login-lockout";
import { AccountLockedError, InvalidCredentialsError } from "../src/server/modules/auth/auth.errors";
import { createLoginLockoutEmail, createOtpEmail } from "../src/lib/email/auth-email.template";

const input = { email: "login@example.com", password: "wrong-password" };
const user = { id: "user", email: input.email, password: "hash", role: "USER", emailVerified: true, deletedAt: null };
beforeEach(async () => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-13T10:00:00Z"));
  await clearLockout(input.email);
  mocks.findUser.mockResolvedValue(user);
  mocks.verify.mockResolvedValue(false);
  mocks.email.mockResolvedValue(undefined);
});
afterEach(() => { vi.useRealTimers(); });

async function failFourTimes() {
  for (let i = 0; i < 4; i++) await expect(loginUser(input)).rejects.toBeInstanceOf(InvalidCredentialsError);
}

describe("password login integration", () => {
  it("starts a lock and sends exactly one security alert", async () => {
    await failFourTimes();
    await expect(loginUser(input)).rejects.toBeInstanceOf(AccountLockedError);
    await expect(loginUser(input)).rejects.toBeInstanceOf(AccountLockedError);
    expect(mocks.email).toHaveBeenCalledOnce();
    expect(mocks.email).toHaveBeenCalledWith(user.email);
    expect(mocks.issue).not.toHaveBeenCalled();
    expect(mocks.verify).toHaveBeenCalledTimes(5);
  });
  it("gives unknown identifiers the same lockout response without email", async () => {
    mocks.findUser.mockResolvedValue(null);
    await failFourTimes();
    const response = await POST(new Request("http://localhost/api/v1/auth/login", { method: "POST", body: JSON.stringify(input) }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("900");
    expect(await response.json()).toEqual({ message: "Too many failed sign-in attempts. Try again later or reset your password." });
    expect(mocks.email).not.toHaveBeenCalled();
  });
  it("returns a normal 429 when security email delivery fails", async () => {
    await failFourTimes();
    mocks.email.mockRejectedValue(new Error("provider unavailable"));
    const response = await POST(new Request("http://localhost/api/v1/auth/login", { method: "POST", body: JSON.stringify(input) }));
    expect(response.status).toBe(429);
    expect(mocks.logError).toHaveBeenCalledWith("auth.login.lockout_alert_failed", expect.any(Error), { userId: user.id });
  });
  it("resets partial failures on success and permits login after lock expiry", async () => {
    await failFourTimes();
    mocks.verify.mockResolvedValue(true);
    mocks.issue.mockResolvedValue({ accessToken: "access", refreshToken: "refresh" });
    expect((await loginUser(input)).accessToken).toBe("access");
    mocks.verify.mockResolvedValue(false);
    await failFourTimes();
    await expect(loginUser(input)).rejects.toBeInstanceOf(AccountLockedError);
    vi.advanceTimersByTime(900_000);
    mocks.verify.mockResolvedValue(true);
    expect((await loginUser(input)).accessToken).toBe("access");
  });
  it("blocks issuance when parallel failures lock during password verification", async () => {
    mocks.verify.mockImplementation(async () => {
      for (let i = 0; i < 5; i++) await recordFailedAttempt(input.email);
      return true;
    });
    await expect(loginUser(input)).rejects.toBeInstanceOf(AccountLockedError);
    expect(mocks.issue).not.toHaveBeenCalled();
  });
  it("keeps the branded alert free of OTP instructions", () => {
    const alert = createLoginLockoutEmail();
    expect(alert.html).toContain("Sign-in temporarily paused");
    expect(alert.html).not.toContain("Your one-time code");
    expect(alert.html).not.toContain("This code expires");
    expect(alert.text).toContain("15-minute pause");
    expect(createOtpEmail("123456").html).toContain("Your one-time code");
  });
});
