import { siteConfig } from "@/config/site";

/**
 * Injects a JSON-LD <script> tag for structured data.
 *
 * Why dangerouslySetInnerHTML:
 * JSON.stringify output is safe here — we control every value. React cannot
 * render <script> children as text because it HTML-escapes them, which would
 * make the JSON invalid to crawlers.
 *
 * One component, many schemas:
 * Google reads any schema.org type from the same script tag position. The
 * caller decides which shape to pass; the renderer stays dumb.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Site-wide Organization + WebSite schema.
 *
 * Why both:
 *   - Organization feeds the knowledge panel (logo, contact, socials).
 *   - WebSite + SearchAction enables the sitelinks search box in Google.
 * Both are homepage-only; repeating them on every page dilutes the signal.
 */
export function HomeJsonLd() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/brand/logo/nikharta-roop-mark-light-512.png`,
    sameAs: [
      siteConfig.social.instagram,
      siteConfig.social.facebook,
      siteConfig.social.twitter,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      email: siteConfig.contact.email,
      telephone: siteConfig.contact.phone,
      contactType: "customer support",
      areaServed: "IN",
      availableLanguage: ["en", "hi"],
    },
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/salons?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <>
      <JsonLd data={organization} />
      <JsonLd data={website} />
    </>
  );
}
