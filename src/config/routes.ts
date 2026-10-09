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
  salonProducts: (slug: string) => `/salons/${slug}/products`,
  salonProductDetail: (slug: string, productSlug: string) =>
    `/salons/${slug}/products/${productSlug}`,
  salonProductCreate: (slug: string) =>
    `/salons/${slug}/manage/products/create`,
  salonProductsManage: (slug: string) => `/salons/${slug}/manage/products`,
  salonProductEdit: (slug: string, productId: string) =>
    `/salons/${slug}/manage/products/${productId}`,
  productCategoriesManage: "/product-categories/manage",
  salonServiceDetail: (salonSlug: string, serviceSlug: string) =>
    `/salons/${salonSlug}/services/${serviceSlug}`,
  salonBooking: (slug: string) => `/salons/${slug}/book`,
  salonPackages: (slug: string) => `/salons/${slug}/packages`,

  // ─── Salon manage — Phase A ───
  salonAppointmentsManage: (slug: string) =>
    `/salons/${slug}/manage/appointments`,
  salonAppointmentManageDetail: (slug: string, appointmentId: string) =>
    `/salons/${slug}/manage/appointments/${appointmentId}`,
  salonPackagesManage: (slug: string) => `/salons/${slug}/manage/packages`,
  salonPackageEdit: (slug: string, packageId: string) =>
    `/salons/${slug}/manage/packages/${packageId}`,
  salonPackageCreate: (slug: string) => `/salons/${slug}/manage/packages/create`,
  salonTemplatesManage: (slug: string) => `/salons/${slug}/manage/templates`,
  salonVerification: (slug: string) => `/salons/${slug}/manage/verification`,
  salonCouponsManage: (slug: string) => `/salons/${slug}/manage/coupons`,
  salonSettingsManage: (slug: string) => `/salons/${slug}/manage/settings`,
  salonCustomerNotes: (slug: string, customerId: string) =>
    `/salons/${slug}/manage/customers/${customerId}/notes`,
  adminSalonVerification: "/admin/salons/verification",
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
