import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  transaction: vi.fn(), userUpdate: vi.fn(), revoke: vi.fn(), findUser: vi.fn(), claim: vi.fn(),
  candidate: vi.fn(), clear: vi.fn(), log: vi.fn(),
}));
vi.mock("../src/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("../src/server/auth/password", () => ({ hashPassword: vi.fn().mockResolvedValue("new-hash") }));
vi.mock("../src/server/auth/login-lockout", () => ({ clearLockout: mocks.clear }));
vi.mock("../src/server/auth/auth.logger", () => ({ logAuthError: mocks.log }));
vi.mock("../src/server/modules/otp/otp.repository", () => ({ findUserByEmailOrPhone: mocks.findUser, claimOtp: mocks.claim }));
vi.mock("../src/server/modules/otp/otp.service", () => ({ verifyOtpCandidate: mocks.candidate, issueOtp: vi.fn() }));
import { resetPassword } from "../src/server/modules/password/password.service";

const input = { email: "recover@example.com", code: "123456", newPassword: "unique-long-passphrase-for-recovery" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.findUser.mockResolvedValue({ id: "user", email: input.email });
  mocks.candidate.mockResolvedValue({ id: "otp", attempts: 0 });
  mocks.claim.mockResolvedValue(true);
  mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) => callback({
    account: { upsert: mocks.userUpdate }, refreshToken: { updateMany: mocks.revoke },
  }));
});
it("clears identifier lockout after committing password reset and session revocation", async () => {
  await resetPassword(input);
  expect(mocks.userUpdate).toHaveBeenCalledOnce();
  expect(mocks.revoke).toHaveBeenCalledOnce();
  expect(mocks.clear).toHaveBeenCalledWith(input.email);
  expect(mocks.clear.mock.invocationCallOrder[0]).toBeGreaterThan(mocks.revoke.mock.invocationCallOrder[0]);
});
it("preserves successful reset when Redis cleanup fails", async () => {
  mocks.clear.mockRejectedValue(new Error("Redis unavailable"));
  await expect(resetPassword(input)).resolves.toBeUndefined();
  expect(mocks.log).toHaveBeenCalledWith("auth.password_reset.lockout_clear_failed", expect.any(Error), { userId: "user" });
});
it("does not clear lockout after a failed OTP claim", async () => {
  mocks.claim.mockResolvedValue(false);
  await expect(resetPassword(input)).rejects.toThrow();
  expect(mocks.clear).not.toHaveBeenCalled();
  expect(mocks.userUpdate).not.toHaveBeenCalled();
});
