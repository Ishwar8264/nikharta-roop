import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { DurationField } from "../src/components/shared/duration-field";

describe("shared duration field", () => {
  it.each([[30, "30 min"], [90, "1 hr 30 min"], [480, "8 hr"], [37, "37 min"]])("displays %i minutes without changing the existing duration", (value, label) => {
    const html = renderToStaticMarkup(createElement(DurationField, {
      id: "duration", value: Number(value), onValueChange: () => {}, isRequired: true,
    }));
    expect(html).toMatch(new RegExp(`data-slot="select-value"[^>]*>[\\s\\S]*?${label}</span>`));
    expect(html).toMatch(/aria-labelledby="[^"]*duration-label/);
  });
});
