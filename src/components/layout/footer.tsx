import Link from "next/link";

import { footerNav } from "@/components/navigation";
import { Brand } from "@/components/shared/brand";
import { siteConfig } from "@/config/site";

/**
 * Public site footer.
 *
 * Why:
 * A server component — it reads static config and renders links, nothing
 * more. Keeping it off the client bundle means the marketing pages pay no
 * JavaScript cost for chrome they never interact with.
 *
 * Layout is a simple three-column grid on desktop that stacks on mobile.
 * The brand block sits above the columns so the logo and description get
 * the full width before the link groups kick in.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* ─── Brand block ─── */}
          <div className="lg:col-span-2">
            <Brand size="lg" />
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              {siteConfig.description}
            </p>

            <div className="mt-6 space-y-1 text-sm text-muted-foreground">
              <p>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="transition-colors hover:text-foreground"
                >
                  {siteConfig.contact.email}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-foreground"
                >
                  {siteConfig.contact.phone}
                </a>
              </p>
            </div>
          </div>

          {/* ─── Link columns ─── */}
          {footerNav.map((group) => (
            <div key={group.title}>
              <h3 className="font-heading text-sm font-semibold tracking-wide text-foreground">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ─── Bottom bar ─── */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {year} {siteConfig.name}. All rights reserved.
          </p>

          <div className="flex items-center gap-5">
            <SocialLink label="Instagram" href={siteConfig.social.instagram} />
            <SocialLink label="Facebook" href={siteConfig.social.facebook} />
            <SocialLink label="Twitter" href={siteConfig.social.twitter} />
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * A single social link.
 *
 * Why:
 * Extracted so the three entries in the bottom bar stay symmetrical and
 * adding a fourth network is one line. `rel="noopener noreferrer"` is
 * required on external links that open in a new tab — it prevents the
 * destination from accessing `window.opener`.
 */
function SocialLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
    </a>
  );
}
