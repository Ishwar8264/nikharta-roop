import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SlugField } from "../src/components/shared/slug-field";
import {
  slugMaxLength,
  slugValidationMessage,
} from "@nikharta-roop/shared/contracts/slug-availability";

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
    const html = renderToStaticMarkup(
      createElement(SlugField, {
        resource: "salon",
        id: "slug",
        value: "test-salon",
        onValueChange: vi.fn(),
        description: "Your salon address",
        "aria-describedby": "external-help",
        checkEnabled: false,
      }),
    );
    expect(html).toContain('for="slug"');
    expect(html).toContain('value="test-salon"');
    expect(html).toContain('aria-describedby="external-help slug-description slug-status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("marks invalid input and prioritizes form errors", () => {
    const html = renderToStaticMarkup(
      createElement(SlugField, {
        resource: "salon",
        id: "slug",
        value: "Bad Slug",
        onValueChange: vi.fn(),
        error: "Server rejected this slug",
      }),
    );
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain("Server rejected this slug");
    expect(html).not.toContain("Checking availability");
  });

  it("recognizes the unchanged slug on edit forms", () => {
    const html = renderToStaticMarkup(
      createElement(SlugField, {
        resource: "salon",
        value: "test-salon",
        currentSlug: "test-salon",
        onValueChange: vi.fn(),
      }),
    );
    expect(html).toContain("This is your current slug.");
    expect(html).not.toContain("Checking availability");
  });

  it("waits for a salon selection for scoped resources", () => {
    const html = renderToStaticMarkup(
      createElement(SlugField, {
        resource: "product",
        salonId: undefined,
        value: "hair-oil",
        onValueChange: vi.fn(),
      }),
    );
    expect(html).toContain("Select a salon to check availability.");
    expect(html).not.toContain("Checking availability");
  });
});
