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
  onboarding: "/onboarding",
  partnerOnboarding: "/onboarding?type=partner",
  salonDetail: (slug: string) => `/salons/${slug}`,
  salonEdit: (slug: string) => `/salons/${slug}/edit`,
  salonServices: (slug: string) => `/salons/${slug}/services`,
  salonServiceCreate: (slug: string) => `/salons/${slug}/services/create`,
  salonServiceCatalog: (slug: string) => `/salons/${slug}/catalog/services`,
  salonServiceEdit: (slug: string, serviceSlug: string) =>
    `/salons/${slug}/services/${serviceSlug}/edit`,
  serviceCategoriesManage: "/service-categories/manage",
  salonProducts: (slug: string) => `/salons/${slug}/products`,
  salonProductDetail: (slug: string, productSlug: string) =>
    `/salons/${slug}/products/${productSlug}`,
  salonProductCreate: (slug: string) =>
    `/salons/${slug}/products/create`,
  salonProductCatalog: (slug: string) => `/salons/${slug}/catalog/products`,
  salonProductEdit: (slug: string, productSlug: string) =>
    `/salons/${slug}/products/${productSlug}/edit`,
  productCategoriesManage: "/product-categories/manage",
  salonServiceDetail: (salonSlug: string, serviceSlug: string) =>
    `/salons/${salonSlug}/services/${serviceSlug}`,
  salonBooking: (slug: string) => `/salons/${slug}/book`,
  salonPackages: (slug: string) => `/salons/${slug}/packages`,
  salonPackageDetail: (slug: string, packageId: string) => `/salons/${slug}/packages/${packageId}`,

  // ─── Salon operations (authorized pages) ───
  salonAppointments: (slug: string) =>
    `/salons/${slug}/appointments`,
  salonAppointmentDetail: (slug: string, appointmentId: string) =>
    `/salons/${slug}/appointments/${appointmentId}`,
  salonStaff: (slug: string) => `/salons/${slug}/staff`,
  salonStaffEdit: (slug: string, staffRef: string) => `/salons/${slug}/staff/${staffRef}/edit`,
  salonStaffCreate: (slug: string) => `/salons/${slug}/staff/create`,
  salonStaffDetail: (slug: string, staffId: string) =>
    `/salons/${slug}/staff/${staffId}`,
  salonPackageCatalog: (slug: string) => `/salons/${slug}/catalog/packages`,
  salonPackageEdit: (slug: string, packageId: string) =>
    `/salons/${slug}/packages/${packageId}/edit`,
  salonPackageCreate: (slug: string) => `/salons/${slug}/packages/create`,
  salonTemplates: (slug: string) => `/salons/${slug}/templates`,
  salonVerification: (slug: string) => `/salons/${slug}/verification`,
  salonCoupons: (slug: string) => `/salons/${slug}/coupons`,
  salonSettings: (slug: string) => `/salons/${slug}/settings`,
  salonWorkingHours: (slug: string) =>
    `/salons/${slug}/working-hours`,
  salonCustomerNotes: (slug: string, customerId: string) =>
    `/salons/${slug}/customers/${customerId}/notes`,

  // ─── Admin ───
  adminSalonVerification: "/admin/salons/verification",
  adminUsers: "/admin/users",
  adminCoupons: "/admin/coupons",
  adminAiUsage: "/admin/ai-usage",
  adminAuditLogs: "/admin/audit-logs",
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
  profileEdit: "/profile/edit",
  settings: "/settings",
  notifications: "/notifications",
  ai: "/ai",
  /**
   * Deep link to a specific AI chat.
   *
   * Why a query string instead of `/ai/{chatId}`:
   * The dashboard serves both the chat list and the open conversation from one
   * route. A query param keeps the list + usage stats mounted while the panel
   * swaps underneath, so navigating between chats is a single searchParam
   * change — no layout shift, no extra route segment to maintain.
   */
  aiChat: (chatId: string) => `/ai?chat=${encodeURIComponent(chatId)}`,

  // ─── System ───
  designSystem: "/design-system",
  sessionRefresh: "/session/refresh",
} as const;

export type Routes = typeof routes;
