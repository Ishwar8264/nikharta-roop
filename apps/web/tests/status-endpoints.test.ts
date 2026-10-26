import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ auth: vi.fn(), salon: vi.fn(), service: vi.fn(), product: vi.fn(), package: vi.fn() }));
vi.mock("../src/server/security/request-context", () => ({ getAuthContext: mocks.auth }));
vi.mock("../src/server/modules/salon/salon.service", () => ({ updateSalon: mocks.salon }));
vi.mock("../src/server/modules/service/service.service", () => ({ updateSalonService: mocks.service }));
vi.mock("../src/server/modules/product/product.service", () => ({ updateSalonProduct: mocks.product }));
vi.mock("../src/server/modules/package/package.service", () => ({ updateSalonPackage: mocks.package }));
import { PATCH as salon } from "../src/app/api/v1/salons/[salonRef]/status/route";
import { PATCH as service } from "../src/app/api/v1/salons/[salonRef]/services/[serviceRef]/status/route";
import { PATCH as product } from "../src/app/api/v1/salons/[salonRef]/products/[productRef]/status/route";
import { PATCH as pkg } from "../src/app/api/v1/salons/[salonRef]/packages/[packageRef]/status/route";
import { SalonRoleInsufficientError, SalonNotFoundError, SalonPublicationBlockedError } from "../src/server/modules/salon/salon.errors";

const id = "a".repeat(48);
beforeEach(() => { vi.resetAllMocks(); mocks.auth.mockResolvedValue({ sub: "manager" }); });
for (const [name, handler, save, status] of [
  ["salon", (r: Request) => salon(r, { params: Promise.resolve({ salonRef: id }) }), mocks.salon, "LIVE"], ["service", (r: Request) => service(r, { params: Promise.resolve({ salonRef: id, serviceRef: id }) }), mocks.service, "PUBLISHED"],
  ["product", (r: Request) => product(r, { params: Promise.resolve({ salonRef: id, productRef: id }) }), mocks.product, "PUBLISHED"], ["package", (r: Request) => pkg(r, { params: Promise.resolve({ salonRef: id, packageRef: id }) }), mocks.package, "PUBLISHED"],
] as const) {
  const request = (body: unknown) => new Request("http://localhost/status", { method: "PATCH", body: JSON.stringify(body) });
  describe(`${name} status endpoint`, () => {
    it("requires authentication before mutation", async () => {
      mocks.auth.mockResolvedValue(null);
      expect((await handler(request({ status }))).status).toBe(401);
      expect(save).not.toHaveBeenCalled();
    });
    it("rejects missing, invalid and extra fields", async () => {
      for (const body of [{}, { status: "INVALID" }, { status, name: "Unexpected" }]) expect((await handler(request(body))).status).toBe(400);
      expect(save).not.toHaveBeenCalled();
    });
    it("passes only status and actor identity to the authorized service", async () => {
      save.mockResolvedValue({ id, status });
      const response = await handler(request({ status }));
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ data: { [name]: { id, status } } });
      const args = name === "salon" ? ["manager", id, { status }] : ["manager", id, id, { status }];
      expect(save).toHaveBeenCalledWith(...args);
    });
    it("preserves authorization and missing-item errors", async () => {
      for (const [error, code] of [[new SalonRoleInsufficientError(), 403], [new SalonNotFoundError(), 404]] as const) {
        save.mockRejectedValue(error);
        expect((await handler(request({ status }))).status).toBe(code);
      }
    });
  });
}
it("returns a conflict when salon verification blocks publication", async () => {
  mocks.salon.mockRejectedValue(new SalonPublicationBlockedError());
  const response = await salon(new Request("http://localhost/status", { method: "PATCH", body: JSON.stringify({ status: "LIVE" }) }), { params: Promise.resolve({ salonRef: id }) });
  expect(response.status).toBe(409);
});
