import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SelectField } from "../src/components/shared/select-field";

const options = [
  { value: "UNISEX", label: "Unisex" },
  { value: "MALE", label: "Men only" },
] as const;

describe("shared select field", () => {
  it("renders the selected display label rather than the raw enum", () => {
    const html = renderToStaticMarkup(
      createElement(SelectField, {
        id: "category",
        label: "Category",
        options,
        value: "UNISEX",
      }),
    );
    expect(html).toMatch(/data-slot="select-value"[^>]*>[\s\S]*?Unisex</);
    expect(html).toContain('for="category"');
    expect(html).toContain('id="category"');
  });

  it("connects errors and help text to the trigger", () => {
    const html = renderToStaticMarkup(
      createElement(SelectField, {
        id: "category",
        label: "Category",
        options,
        value: "MALE",
        description: "Choose your audience",
        error: "Select a category",
      }),
    );
    expect(html).toContain('data-invalid="true"');
    expect(html).toMatch(
      /aria-describedby="[^"]*category-description category-error/,
    );
  });

  it("shows a placeholder and disables empty option lists", () => {
    const html = renderToStaticMarkup(
      createElement(SelectField, {
        label: "Category",
        options: [],
        value: null,
        placeholder: "No categories yet",
      }),
    );
    expect(html).toContain("No categories yet");
    expect(html).toContain('disabled=""');
  });
});
