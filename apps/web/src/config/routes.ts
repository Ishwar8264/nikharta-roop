/** Link targets used by the component library; feature pages are not implemented yet. */
export const routes = {
  home: "/",
  salons: "/salons",
  blog: "/blog",
  about: "/about",
  contact: "/contact",
  help: "/help",
  privacy: "/privacy",
  terms: "/terms",
  dashboard: "/dashboard",
  appointments: "/appointments",
  favorites: "/favorites",
  loyalty: "/loyalty",
  ai: "/ai",
  profile: "/profile",
  settings: "/settings",
  salonDetail: (slug: string) => `/salons/${encodeURIComponent(slug)}`,
} as const;
