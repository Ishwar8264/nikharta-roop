import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), list: vi.fn() }));
vi.mock("../src/server/security/request-context", () => ({ getAuthContext: mocks.auth }));
vi.mock("../src/server/modules/service/service.service", () => ({ listPackageServiceOptions: mocks.list }));
import { GET } from "../src/app/api/v1/salons/[salonRef]/service-options/route";
import { SalonRoleInsufficientError } from "../src/server/modules/salon/salon.errors";
const context = { params: Promise.resolve({ salonRef: "glow-salon" }) };
beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ sub: "manager" });
  mocks.list.mockResolvedValue({ items: [], hasMore: false, nextCursor: null });
});
describe("package service options", () => {
  it("passes keyword filtering and the actor to the authorized query", async () => {
    const response = await GET(new Request("https://example.com/api?search=hair"), context);
    expect(response.status).toBe(200);
    expect(mocks.list).toHaveBeenCalledWith("manager", "glow-salon", { search: "hair" });
    expect(await response.json()).toEqual({ data: [], meta: { hasMore: false, nextCursor: null } });
  });
  it("rejects anonymous requests without reading services", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await GET(new Request("https://example.com/api"), context)).status).toBe(401);
    expect(mocks.list).not.toHaveBeenCalled();
  });
  it("preserves management authorization failures", async () => {
    mocks.list.mockRejectedValue(new SalonRoleInsufficientError());
    expect((await GET(new Request("https://example.com/api"), context)).status).toBe(403);
  });
  it("validates cursor and query length", async () => {
    for (const query of ["cursor=bad", `search=${"a".repeat(81)}`, "unexpected=true"]) {
      expect((await GET(new Request(`https://example.com/api?${query}`), context)).status).toBe(400);
    }
    expect(mocks.list).not.toHaveBeenCalled();
  });
});
