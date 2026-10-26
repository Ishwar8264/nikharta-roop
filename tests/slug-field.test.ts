import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("../src/lib/api/backend.client", () => ({ api: { get } }));

import { SlugField } from "../src/components/shared/slug-field";
import { checkSlugAvailability, findAvailableSlugSuggestions } from "../src/lib/api/slug-availability";
import type { SlugAvailabilityQuery } from "../src/lib/slug-availability";
import { slugMaxLength, slugValidationMessage } from "../src/lib/slug-availability";

beforeEach(() => vi.resetAllMocks());

describe("slug availability client", () => {
  it("passes scoped queries and cancellation through the existing client", async () => {
    const data = { resource: "service", slug: "haircut", salonId: "salon-id", available: true, reason: null };
    get.mockResolvedValue({ message: "Checked", data });
    const controller = new AbortController();
    await expect(checkSlugAvailability({ resource: "service", slug: "haircut", salonId: "salon-id" }, { signal: controller.signal })).resolves.toEqual(data);
    expect(get).toHaveBeenCalledWith("/slugs/availability?resource=service&slug=haircut&salonId=salon-id", { signal: controller.signal });
  });

  it("encodes query values without adding salon scope to global resources", async () => {
    get.mockResolvedValue({ data: { available: false } });
    await checkSlugAvailability({ resource: "salon", slug: "test&resource=service" });
    expect(get).toHaveBeenCalledWith("/slugs/availability?resource=salon&slug=test%26resource%3Dservice", undefined);
  });

  it("propagates request failures rather than declaring a slug available", async () => {
    get.mockRejectedValue(new Error("Network error"));
    await expect(checkSlugAvailability({ resource: "salon", slug: "test" })).rejects.toThrow("Network error");
  });
});

describe("slug field rendering and validation", () => {
  it("keeps blog and ordinary resource length limits distinct", () => {
    expect(slugMaxLength("blog-post")).toBe(120);
    expect(slugMaxLength("salon")).toBe(80);
    expect(slugValidationMessage("a".repeat(81), 80)).toContain("80");
    expect(slugValidationMessage("a".repeat(81), 120)).toBe(null);
  });

  it("rejects malformed slugs locally", () => {
    for (const value of ["a", "Uppercase", "two--hyphens", "space here", "-leading"]) {
      expect(slugValidationMessage(value, 80)).not.toBe(null);
    }
    expect(slugValidationMessage("salon-123", 80)).toBe(null);
    expect(slugValidationMessage("", 80)).toBe(null);
  });

  it("links the label, help and status to the controlled input", () => {
    const html = renderToStaticMarkup(createElement(SlugField, {
      resource: "salon", id: "slug", value: "test-salon", onValueChange: vi.fn(),
      description: "Your salon address", "aria-describedby": "external-help", checkEnabled: false,
    }));
    expect(html).toContain('for="slug"');
    expect(html).toContain('value="test-salon"');
    expect(html).toContain('aria-describedby="external-help slug-description slug-status"');
    expect(html).toContain('aria-live="polite"');
    expect(get).not.toHaveBeenCalled();
  });

  it("marks invalid input and prioritizes form errors", () => {
    const html = renderToStaticMarkup(createElement(SlugField, {
      resource: "salon", id: "slug", value: "Bad Slug", onValueChange: vi.fn(), error: "Server rejected this slug",
    }));
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("Server rejected this slug");
    expect(html).not.toContain("Checking availability");
  });

  it("recognizes the unchanged slug on edit forms", () => {
    const html = renderToStaticMarkup(createElement(SlugField, {
      resource: "salon", value: "test-salon", currentSlug: "test-salon", onValueChange: vi.fn(),
    }));
    expect(html).toContain("This is your current slug.");
    expect(html).not.toContain("Checking availability");
  });

  it("waits for a salon selection for scoped resources", () => {
    const html = renderToStaticMarkup(createElement(SlugField, {
      resource: "product", salonId: undefined, value: "hair-oil", onValueChange: vi.fn(),
    }));
    expect(html).toContain("Select a salon to check availability.");
    expect(html).not.toContain("Checking availability");
  });
});

describe("verified slug suggestions", () => {
  it("returns four available alternatives and preserves salon scope", async () => {
    const checker = vi.fn(async (query: SlugAvailabilityQuery) => ({ ...query, available: query.slug !== "haircut-2", reason: query.slug === "haircut-2" ? "taken" as const : null }));
    const signal = new AbortController().signal;
    const values = await findAvailableSlugSuggestions({ resource: "service", salonId: "salon-id", slug: "haircut" }, { signal, maxLength: 80 }, checker);
    expect(values).toEqual(["haircut-3", "haircut-4", "haircut-5", "haircut-6"]);
    expect(checker).toHaveBeenCalledTimes(8);
    expect(checker).toHaveBeenCalledWith({ resource: "service", salonId: "salon-id", slug: "haircut-3" }, { signal });
  });

  it("keeps long alternatives valid within the resource length limit", async () => {
    const checker = vi.fn(async (query: SlugAvailabilityQuery) => ({ ...query, available: true, reason: null }));
    const values = await findAvailableSlugSuggestions({ resource: "salon", slug: `${"a".repeat(77)}-aa` }, { signal: new AbortController().signal, maxLength: 80 }, checker);
    expect(values).toHaveLength(4);
    for (const value of values) {
      expect(value.length).toBeLessThanOrEqual(80);
      expect(slugValidationMessage(value, 80)).toBe(null);
    }
  });

  it("bounds checks when no alternative is available", async () => {
    const checker = vi.fn(async (query: SlugAvailabilityQuery) => ({ ...query, available: false, reason: "taken" as const }));
    await expect(findAvailableSlugSuggestions({ resource: "salon", slug: "salon" }, { signal: new AbortController().signal, maxLength: 80 }, checker)).resolves.toEqual([]);
    expect(checker).toHaveBeenCalledTimes(16);
  });

  it("stops checking after cancellation", async () => {
    const controller = new AbortController();
    const checker = vi.fn(async (query: SlugAvailabilityQuery) => {
      controller.abort();
      return { ...query, available: true, reason: null };
    });
    await expect(findAvailableSlugSuggestions({ resource: "salon", slug: "salon" }, { signal: controller.signal, maxLength: 80 }, checker)).resolves.toEqual([]);
    expect(checker).toHaveBeenCalledTimes(4);
  });

  it("does not present unchecked alternatives on a request failure", async () => {
    const checker = vi.fn().mockRejectedValue(new Error("Network error"));
    await expect(findAvailableSlugSuggestions({ resource: "salon", slug: "salon" }, { signal: new AbortController().signal, maxLength: 80 }, checker)).rejects.toThrow("Network error");
  });
});
