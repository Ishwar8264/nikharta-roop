import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ memberships: vi.fn(), verify: vi.fn(), user: vi.fn(), tokens: vi.fn(), cookies: vi.fn() }));
vi.mock("../src/server/modules/otp/otp.service", () => ({ verifyOtpCode: mocks.verify }));
vi.mock("../src/server/modules/auth/auth.service", () => ({ getCurrentUser: mocks.user }));
vi.mock("../src/server/auth/token.service", () => ({ issueTokenPair: mocks.tokens }));
vi.mock("../src/server/auth/cookies", () => ({ setSessionCookies: mocks.cookies }));
vi.mock("../src/server/modules/salon/salon.repository", () => ({ listUserSalonMemberships: mocks.memberships }));
import { POST } from "../src/app/api/v1/auth/otp/verify/route";
beforeEach(() => {
  vi.resetAllMocks(); mocks.verify.mockResolvedValue({ userId: "staff", channel: "EMAIL" });
  mocks.memberships.mockResolvedValue([{ id: "member-id", slug: "priya", role: "STAFF", salon: { slug: "glow-salon", isActive: true } }]);
  mocks.user.mockResolvedValue({ id: "staff", role: "USER" });
  mocks.tokens.mockResolvedValue({ accessToken: "token", accessTokenExpiresIn: 900 });
});
const request = (createSession?: boolean) => new Request("http://localhost/api/v1/auth/otp/verify", { method: "POST", body: JSON.stringify({ email: "staff@example.com", code: "123456", ...(createSession === undefined ? {} : { createSession }) }) });
it("verifies activation without issuing tokens or replacing existing session cookies", async () => {
  const response = await POST(request(false));
  expect(response.status).toBe(200);
  expect((await response.json()).data.staffProfileUrl).toBe("/salons/glow-salon/staff/priya");
  expect(mocks.verify).toHaveBeenCalled();
  expect(mocks.user).not.toHaveBeenCalled();
  expect(mocks.tokens).not.toHaveBeenCalled();
  expect(mocks.cookies).not.toHaveBeenCalled();
  expect(response.headers.get("set-cookie")).toBeNull();
});
it("preserves the existing registration session flow by default", async () => {
  expect((await POST(request())).status).toBe(200);
  expect(mocks.tokens).toHaveBeenCalled();
  expect(mocks.cookies).toHaveBeenCalled();
});
