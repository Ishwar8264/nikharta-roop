/**
 * Application route constants.
 *
 * Why:
 * Path strings live here, never as raw literals in components. A URL change
 * becomes a one-line edit, and `routes.salonDetail(slug)` cannot drift out
 * of sync with the page that serves it.
 */
export const routes = {
  // ─── Public ───
  home: "/",
  salons: "/salons",
  salonDetail: (slug: string) => `/salons/${slug}`,
  salonBooking: (slug: string) => `/salons/${slug}/book`,
  services: "/services",
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  about: "/about",
  contact: "/contact",

  // ─── Auth ───
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyOtp: "/verify-otp",

  // ─── Authenticated customer ───
  dashboard: "/dashboard",
  appointments: "/appointments",
  appointmentDetail: (id: string) => `/appointments/${id}`,
  favorites: "/favorites",
  loyalty: "/loyalty",
  profile: "/profile",
  settings: "/settings",
  notifications: "/notifications",
  ai: "/ai",

  // ─── System ───
  designSystem: "/design-system",
} as const;

export type Routes = typeof routes;
