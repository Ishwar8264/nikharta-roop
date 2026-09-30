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
  salonCreate: "/salons/create",
  salonDetail: (slug: string) => `/salons/${slug}`,
  salonManage: (slug: string) => `/salons/${slug}/manage`,
  salonServices: (slug: string) => `/salons/${slug}/services`,
  salonServiceCreate: (slug: string) => `/salons/${slug}/services/create`,
  salonServicesManage: (slug: string) => `/salons/${slug}/manage/services`,
  salonServiceEdit: (slug: string, serviceId: string) =>
    `/salons/${slug}/manage/services/${serviceId}`,
  serviceCategoriesManage: "/service-categories/manage",
  salonServiceDetail: (salonSlug: string, serviceSlug: string) =>
    `/salons/${salonSlug}/services/${serviceSlug}`,
  salonBooking: (slug: string) => `/salons/${slug}/book`,
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  about: "/about",
  contact: "/contact",

  // ─── Legal / Support ───
  help: "/help",
  privacy: "/privacy",
  terms: "/terms",

  // ─── Auth ───
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyOtp: "/verify-otp",
  verifyOtpForEmail: (email: string) =>
    `/verify-otp?email=${encodeURIComponent(email)}`,

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
  sessionRefresh: "/session/refresh",
} as const;

export type Routes = typeof routes;
