import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const delegate = () => ({ findUnique: vi.fn(), findFirst: vi.fn() });
  return {
    auth: vi.fn(),
    prisma: {
      salon: delegate(), service: delegate(), product: delegate(), package: delegate(),
      serviceCategory: delegate(), productCategory: delegate(), blogPost: delegate(),
      blogCategory: delegate(), blogTag: delegate(),
    },
  };
});
vi.mock("../src/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("../src/server/auth/session", () => ({ getAuthContext: mocks.auth }));

import { GET } from "../src/app/api/v1/slugs/availability/route";
import { slugAvailabilityQuerySchema, slugResources } from "../src/server/modules/slug/slug.schema";

const salonId = "a".repeat(48);
const actor = { sub: "b".repeat(48), role: "SUPER_ADMIN" };

function check(query: string) {
  return GET(new Request(`https://example.com/api/v1/slugs/availability?${query}`));
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue(actor);
  for (const delegate of Object.values(mocks.prisma)) {
    delegate.findUnique.mockResolvedValue(null);
    delegate.findFirst.mockResolvedValue(null);
  }
  mocks.prisma.salon.findFirst.mockResolvedValue({ id: salonId, members: [{ role: "MANAGER" }] });
});

describe("slug availability query", () => {
  it("requires salonId only for scoped resources", () => {
    for (const resource of ["service", "product", "package"]) {
      expect(slugAvailabilityQuerySchema.safeParse({ resource, slug: "haircut" }).success).toBe(false);
      expect(slugAvailabilityQuerySchema.safeParse({ resource, slug: "haircut", salonId }).success).toBe(true);
    }
    expect(slugAvailabilityQuerySchema.safeParse({ resource: "salon", slug: "salon", salonId }).success).toBe(false);
  });

  it("matches resource slug limits and rejects unsupported inputs", () => {
    expect(slugAvailabilityQuerySchema.safeParse({ resource: "blog-post", slug: "a".repeat(120) }).success).toBe(true);
    for (const slug of ["a", "Salon", "with spaces", "two--hyphens", "-salon", "a".repeat(81)]) {
      expect(slugAvailabilityQuerySchema.safeParse({ resource: "salon", slug }).success).toBe(false);
    }
    expect(slugAvailabilityQuerySchema.safeParse({ resource: "user", slug: "test" }).success).toBe(false);
    expect(slugAvailabilityQuerySchema.safeParse({ resource: "salon", slug: "test", table: "User" }).success).toBe(false);
  });
});

describe("GET slug availability", () => {
  const lookupByResource = {
    salon: mocks.prisma.salon.findUnique,
    service: mocks.prisma.service.findFirst,
    product: mocks.prisma.product.findFirst,
    package: mocks.prisma.package.findUnique,
    "service-category": mocks.prisma.serviceCategory.findUnique,
    "product-category": mocks.prisma.productCategory.findUnique,
    "blog-post": mocks.prisma.blogPost.findUnique,
    "blog-category": mocks.prisma.blogCategory.findUnique,
    "blog-tag": mocks.prisma.blogTag.findUnique,
  };
  for (const resource of slugResources) {
    it(`checks the ${resource} namespace`, async () => {
      const scope = ["service", "product", "package"].includes(resource) ? `&salonId=${salonId}` : "";
      const response = await check(`resource=${resource}&slug=test-slug${scope}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("Cache-Control")).toBe("no-store");
      expect(await response.json()).toMatchObject({ data: { resource, slug: "test-slug", available: true, reason: null } });
      expect(lookupByResource[resource]).toHaveBeenCalledOnce();
    });
    it(`reports occupied slugs in the ${resource} namespace`, async () => {
      lookupByResource[resource].mockResolvedValue({ id: "occupied" });
      const scope = ["service", "product", "package"].includes(resource) ? `&salonId=${salonId}` : "";
      const response = await check(`resource=${resource}&slug=test-slug${scope}`);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ data: { resource, available: false, reason: "taken" } });
    });
  }

  it("requires authentication", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await check("resource=salon&slug=test")).status).toBe(401);
    expect(mocks.prisma.salon.findUnique).not.toHaveBeenCalled();
  });

  it("allows any authenticated user to check a salon slug", async () => {
    mocks.auth.mockResolvedValue({ ...actor, role: "USER" });
    mocks.prisma.salon.findUnique.mockResolvedValue({ id: "occupied", deletedAt: new Date() });
    const response = await check("resource=salon&slug=test");
    expect(await response.json()).toMatchObject({ data: { available: false, reason: "taken" } });
    expect(mocks.prisma.salon.findUnique).toHaveBeenCalledWith({ where: { slug: "test" }, select: { id: true } });
  });

  it("rejects unknown, repeated and malformed parameters", async () => {
    for (const query of ["resource=salon&slug=Bad", "resource=salon&slug=test&slug=other", "resource=user&slug=test", "resource=service&slug=test", "resource=salon&slug=test&table=salon"]) {
      expect((await check(query)).status).toBe(400);
    }
    expect(mocks.prisma.salon.findUnique).not.toHaveBeenCalled();
  });

  it("checks salon membership before reading scoped slugs", async () => {
    mocks.prisma.salon.findFirst.mockResolvedValue({ id: salonId, members: [] });
    expect((await check(`resource=service&slug=haircut&salonId=${salonId}`)).status).toBe(404);
    expect(mocks.prisma.service.findFirst).not.toHaveBeenCalled();
  });

  it("denies staff and restricts categories/blog to platform administrators", async () => {
    mocks.prisma.salon.findFirst.mockResolvedValue({ id: salonId, members: [{ role: "STAFF" }] });
    expect((await check(`resource=product&slug=test&salonId=${salonId}`)).status).toBe(403);
    mocks.auth.mockResolvedValue({ ...actor, role: "USER" });
    for (const resource of ["service-category", "product-category", "blog-post", "blog-category", "blog-tag"]) {
      expect((await check(`resource=${resource}&slug=test`)).status).toBe(403);
    }
  });

  it("reports reserved service slugs without querying the service table", async () => {
    const response = await check(`resource=service&slug=create&salonId=${salonId}`);
    expect(await response.json()).toMatchObject({ data: { available: false, reason: "reserved" } });
    expect(mocks.prisma.service.findFirst).not.toHaveBeenCalled();
  });

  it("uses salon scope and does not filter inactive/deleted services", async () => {
    mocks.prisma.service.findFirst.mockResolvedValue({ id: "taken" });
    const response = await check(`resource=service&slug=haircut&salonId=${salonId}`);
    expect(await response.json()).toMatchObject({ data: { available: false, reason: "taken", salonId } });
    expect(mocks.prisma.service.findFirst).toHaveBeenCalledWith({ where: { salonId, slug: "haircut" }, select: { id: true } });
  });

  it("includes soft-deleted packages in the composite unique lookup", async () => {
    mocks.prisma.package.findUnique.mockResolvedValue({ id: "deleted-package" });
    const response = await check(`resource=package&slug=bridal&salonId=${salonId}`);
    expect(await response.json()).toMatchObject({ data: { available: false, reason: "taken" } });
    expect(mocks.prisma.package.findUnique).toHaveBeenCalledWith({ where: { salonId_slug: { salonId, slug: "bridal" } }, select: { id: true } });
  });

  it("returns an error rather than reporting availability when a query fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      mocks.prisma.salon.findUnique.mockRejectedValue(new Error("Database unavailable"));
      expect((await check("resource=salon&slug=test")).status).toBe(500);
    } finally {
      log.mockRestore();
    }
  });
});
