import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ user: vi.fn(), otp: vi.fn(), compare: vi.fn(), claim: vi.fn(), verified: vi.fn(), hash: vi.fn(), update: vi.fn(), increment: vi.fn(), used: vi.fn(), transaction: vi.fn() }));
vi.mock("../src/lib/prisma", () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock("../src/lib/email", () => ({ sendOtpEmail: vi.fn() }));
vi.mock("../src/server/auth/password", () => ({ hashPassword: mocks.hash }));
vi.mock("../src/server/auth/otp", () => ({ verifyOtp: mocks.compare, OTP_MAX_ATTEMPTS: 5, OTP_RESEND_COOLDOWN_SECONDS: 60, generateOtp: vi.fn(), hashOtp: vi.fn(), otpExpiryFromNow: vi.fn() }));
vi.mock("../src/server/modules/otp/otp.repository", () => ({ findUserByEmailOrPhone: mocks.user, findOtpForVerification: mocks.otp, claimOtp: mocks.claim, markUserVerified: mocks.verified, incrementOtpAttempts: mocks.increment, markOtpUsed: mocks.used }));
import { verifyOtpCode } from "../src/server/modules/otp/otp.service";
import { OtpAccountSetupRequiredError, OtpInvalidError, OtpExpiredError } from "../src/server/modules/otp/otp.errors";
import { verifyOtpSchema } from "../src/server/modules/otp/otp.schema";
const input = { email: "staff@example.com", code: "123456", newPassword: "StaffPassword123" };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ id: "staff", password: null, emailVerified: false });
  mocks.otp.mockResolvedValue({ id: "otp", attempts: 0, maxAttempts: 5, expiresAt: new Date(Date.now() + 60000), codeHash: "otp-hash" });
  mocks.compare.mockResolvedValue(true); mocks.claim.mockResolvedValue(true); mocks.hash.mockResolvedValue("password-hash"); mocks.update.mockResolvedValue({ count: 1 });
  mocks.transaction.mockImplementation((callback) => callback({ user: { updateMany: mocks.update } }));
});
it("requires the recipient to set a password without consuming their code", async () => {
  await expect(verifyOtpCode({ email: input.email, code: input.code })).rejects.toBeInstanceOf(OtpAccountSetupRequiredError);
  expect(mocks.claim).not.toHaveBeenCalled(); expect(mocks.hash).not.toHaveBeenCalled();
});
it("atomically verifies email and initializes a recipient-chosen password", async () => {
  await expect(verifyOtpCode(input)).resolves.toEqual({ userId: "staff", channel: "EMAIL" });
  expect(mocks.hash).toHaveBeenCalledWith(input.newPassword);
  expect(mocks.update).toHaveBeenCalledWith({ where: { id: "staff", password: null, deletedAt: null }, data: { password: "password-hash", emailVerified: true } });
  expect(mocks.claim).toHaveBeenCalledOnce();
});
it("never overwrites an existing password", async () => {
  mocks.user.mockResolvedValue({ id: "staff", password: "existing-hash" });
  await verifyOtpCode(input);
  expect(mocks.hash).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled(); expect(mocks.verified).toHaveBeenCalledOnce();
});
it("rejects wrong codes before changing credentials", async () => {
  mocks.compare.mockResolvedValue(false); mocks.increment.mockResolvedValue(true);
  await expect(verifyOtpCode(input)).rejects.toBeInstanceOf(OtpInvalidError);
  expect(mocks.hash).not.toHaveBeenCalled(); expect(mocks.update).not.toHaveBeenCalled();
});
it("rejects expired codes", async () => {
  mocks.otp.mockResolvedValue({ id: "otp", attempts: 0, maxAttempts: 5, expiresAt: new Date(0) });
  await expect(verifyOtpCode(input)).rejects.toBeInstanceOf(OtpExpiredError);
  expect(mocks.update).not.toHaveBeenCalled();
});
it("rejects replayed OTP claims", async () => {
  mocks.claim.mockResolvedValue(false);
  await expect(verifyOtpCode(input)).rejects.toBeInstanceOf(OtpInvalidError);
  expect(mocks.update).not.toHaveBeenCalled();
});
it("rejects concurrent credential changes", async () => {
  mocks.update.mockResolvedValue({ count: 0 });
  await expect(verifyOtpCode(input)).rejects.toBeInstanceOf(OtpInvalidError);
});
it("enforces password length at the API schema boundary", () => {
  expect(verifyOtpSchema.safeParse({ ...input, newPassword: "short" }).success).toBe(false);
  expect(verifyOtpSchema.safeParse({ ...input, newPassword: "a".repeat(129) }).success).toBe(false);
});
