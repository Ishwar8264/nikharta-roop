// Load the shared public route catalog for consistent footer navigation.
import { PUBLIC_NAV_ITEMS } from "@/src/components/navigation/navigation.config";
// Load the established salon brand treatment used by global navigation.
import { NavbarBrand } from "@/src/components/navigation/navbar-brand";
// Load optimized server-rendered navigation for footer destinations.
import Link from "next/link";

// Close the public landing page with useful navigation and brand context.
export function HomeFooter() {
  // Resolve the display year during server rendering without client hydration work.
  const currentYear = new Date().getFullYear();

  // Keep footer navigation simple because the primary navbar already handles account actions.
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      {/* Align footer content with the public page and navbar width. */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-10">
        {/* Separate brand context from route links on wider viewports. */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          {/* Keep the brand promise concise at the end of the journey. */}
          <div className="max-w-sm">
            <NavbarBrand />
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Thoughtful salon care, useful guidance, and experiences designed
              around your own sense of style.
            </p>
          </div>

          {/* Reuse the same public destinations so footer links never drift from navigation. */}
          <nav aria-label="Footer navigation">
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">
              {PUBLIC_NAV_ITEMS.map((item) => (
                // Keep every destination directly accessible without nested menus.
                <li key={item.href}>
                  <Link
                    className="text-sm font-semibold text-muted-foreground transition hover:text-primary"
                    href={item.href}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Keep legal context visually separate from discovery navigation. */}
        <div className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          © {currentYear} Nikharta Roop Salon &amp; Studio. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
