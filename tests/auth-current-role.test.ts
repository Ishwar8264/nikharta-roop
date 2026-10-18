import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ verify: vi.fn(), user: vi.fn() }));
vi.mock("../src/server/auth/jwt", () => ({ verifyAccessToken: mocks.verify }));
vi.mock("../src/lib/prisma", () => ({ prisma: { user: { findFirst: mocks.user } } }));
import { getAuthContext } from "../src/server/auth/session";
const request = new Request("http://localhost/api/v1/admin/users", { headers: { Authorization: "Bearer test-token" } });
beforeEach(() => { vi.resetAllMocks(); mocks.verify.mockResolvedValue({ sub: "u", role: "SUPER_ADMIN" }); });
it("uses a demoted user's current role even while their token is valid", async () => {
  mocks.user.mockResolvedValue({ role: "USER" });
  expect(await getAuthContext(request)).toMatchObject({ sub: "u", role: "USER" });
});
it("rejects deleted accounts and failed identity lookups", async () => {
  mocks.user.mockResolvedValue(null);
  expect(await getAuthContext(request)).toBeNull();
  mocks.user.mockRejectedValue(new Error("Unavailable"));
  expect(await getAuthContext(request)).toBeNull();
});
