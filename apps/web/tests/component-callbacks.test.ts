import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Editor } from "@tiptap/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tiptap/react", () => ({ useEditorState: () => false }));

import { DescriptionWritingDialog } from "../src/components/shared/description-writing-dialog";
import { SlugField } from "../src/components/shared/slug-field";

// Preserved UI must remain usable without the removed API implementations.
describe("optional backend callbacks", () => {
  it("does not claim slug availability without a supplied checker", () => {
    const html = renderToStaticMarkup(createElement(SlugField, {
      resource: "salon", value: "sample-salon", onValueChange: vi.fn(),
    }));
    expect(html).toContain('value="sample-salon"');
    expect(html).not.toContain("Checking availability");
    expect(html).not.toContain("This slug is available");
  });

  it("disables AI generation until a caller supplies a generator", () => {
    const editor = {} as Editor;
    const html = renderToStaticMarkup(createElement(DescriptionWritingDialog, { editor, context: "Salon" }));
    expect(html).toContain("Write with AI");
    expect(html).toMatch(/\sdisabled(?:="[^"]*")?(?=\s|>)/);
    const connected = renderToStaticMarkup(createElement(DescriptionWritingDialog, {
      editor, context: "Salon", onGenerate: vi.fn(),
    }));
    expect(connected).not.toMatch(/\sdisabled(?:="[^"]*")?(?=\s|>)/);
  });
});
