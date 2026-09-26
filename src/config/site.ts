/**
 * Site-wide metadata.
 *
 * Why:
 * A single source of truth for the brand name, contact info, and social
 * links keeps them out of components — so a rebrand is one file, not a
 * search-and-replace. Values are marked `as const` so TypeScript narrows
 * literal types at call sites.
 */
export const siteConfig = {
  name: "Nikharta Roop",
  shortName: "Nikharta",
  description: "Premium salon booking platform",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  locale: "en-IN",
  currency: "INR",
  contact: {
    email: "hello@nikhartaroop.com",
    phone: "+91 98765 43210",
  },
  social: {
    instagram: "https://instagram.com/nikhartaroop",
    facebook: "https://facebook.com/nikhartaroop",
    twitter: "https://twitter.com/nikhartaroop",
  },
} as const;

export type SiteConfig = typeof siteConfig;
