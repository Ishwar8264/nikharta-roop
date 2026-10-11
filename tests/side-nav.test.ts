import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/account/profile", pending: false }));

vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
vi.mock("next/link", () => ({
  default: ({ href, children, prefetch: _prefetch, ...props }: { href: string; children: ReactNode; prefetch?: boolean }) =>
    {
      void _prefetch;
      return createElement("a", { href, ...props }, children);
    },
  useLinkStatus: () => ({ pending: navigation.pending }),
}));

import { SideNav } from "../src/components/shared/side-nav";

const items = [
  { href: "/account", label: "Overview", matchNested: false },
  { href: "/account/profile", label: "Profile" },
];

describe("SideNav", () => {
  it("marks only the matched link and respects exact matching", () => {
    navigation.pending = false;
    const html = renderToStaticMarkup(createElement(SideNav, { items }));
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    expect(html).toMatch(/href="\/account\/profile" aria-current="page"/);
    expect(html).not.toContain("data-pending");
  });

  it("shows contextual links only inside their section and matches children exactly", () => {
    const section = [{ href: "/salons/glow/services", label: "Services", subItems: [
      { href: "/salons/glow/services", label: "All services", matchNested: false },
      { href: "/salons/glow/services/create", label: "Add service", matchNested: false },
    ] }];
    const previousPath = navigation.pathname;
    try {
      navigation.pathname = "/salons/glow/services/create";
      const html = renderToStaticMarkup(createElement(SideNav, { items: section }));
      expect(html).toContain("All services");
      expect(html).toContain('aria-expanded="true"');
      expect(html).toContain("lucide-chevron-up");
      expect(html).toMatch(/href="\/salons\/glow\/services\/create" aria-current="page"/);
      expect(html.match(/aria-current="page"/g)).toHaveLength(2);
      navigation.pathname = "/salons/glow/products";
      const other = renderToStaticMarkup(createElement(SideNav, { items: section }));
      expect(other).not.toContain("All services");
      expect(other).toContain('aria-expanded="false"');
      expect(other).toContain("lucide-chevron-down");
      expect(other).not.toContain("Add service");
    } finally {
      navigation.pathname = previousPath;
    }
  });

  it("keeps a submenu open on a child route outside the parent URL", () => {
    const previousPath = navigation.pathname;
    try {
      navigation.pathname = "/salons/glow/manage/products/create";
      const html = renderToStaticMarkup(createElement(SideNav, { items: [{
        href: "/salons/glow/products", label: "Products", subItems: [
          { href: "/salons/glow/products", label: "All products", matchNested: false },
          { href: navigation.pathname, label: "Add product", matchNested: false },
        ],
      }] }));
      expect(html).toContain("All products");
      expect(html).toContain('aria-expanded="true"');
      expect(html).toContain("lucide-chevron-up");
      expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    } finally {
      navigation.pathname = previousPath;
    }
  });

  it("renders caller groups, slots, badges and navigation label", () => {
    const html = renderToStaticMarkup(createElement(SideNav, {
      "aria-label": "Account navigation",
      groups: [{ id: "account", label: "My account", items: [{ href: "/account/profile", label: "Profile", badge: 0 }] }],
      header: createElement("h2", null, "Account"),
      footer: createElement("p", null, "Support"),
      orientation: "vertical",
    }));
    expect(html).toContain('aria-label="Account navigation"');
    expect(html).toContain("My account");
    expect(html).toContain("<h2>Account</h2>");
    expect(html).toContain("<p>Support</p>");
    expect(html).toContain(">0</span>");
    expect(html).toContain("flex-col");
  });

  it("uses pending status and replaces the trailing icon with the custom indicator", () => {
    navigation.pending = true;
    try {
      const html = renderToStaticMarkup(createElement(SideNav, {
        items: [{ href: "/account/profile", label: "Profile", iconRight: createElement("span", null, "Arrow") }],
        linkDefaults: { pendingIndicator: createElement("span", null, "Loading indicator"), pendingLabel: "Opening page" },
      }));
      expect(html).toContain('data-pending="true"');
      expect(html).toContain("Opening page");
      expect(html).toContain("Loading indicator");
      expect(html).not.toContain("Arrow");
    } finally {
      navigation.pending = false;
    }
  });

  it("lets item props override shared pending defaults", () => {
    navigation.pending = true;
    try {
      const html = renderToStaticMarkup(createElement(SideNav, {
        items: [{ href: "/account/profile", label: "Profile", showSpinner: false }],
        linkDefaults: { showSpinner: true },
      }));
      expect(html).not.toContain("data-pending");
    } finally {
      navigation.pending = false;
    }
  });
});
