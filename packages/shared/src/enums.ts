/** Domain enum types. packages/db checks these against generated Prisma types. */
export type SalonStatus = "DRAFT" | "LIVE" | "TEMPORARILY_CLOSED" | "ARCHIVED";
export type CatalogStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "ARCHIVED";
export type PlatformRole = "SUPER_ADMIN" | "ADMIN" | "CONTENT_ADMIN" | "USER";
export type MediaPurpose =
  "VERIFICATION" | "GENERAL" | "SALON" | "PRODUCT" | "SERVICE" | "BLOG" | "AVATAR" | "REVIEW";
export type SalonMemberRole = "OWNER" | "MANAGER" | "STAFF";
export type OtpChannel = "EMAIL" | "PHONE" | "WHATSAPP";
export type OtpPurpose = "EMAIL_VERIFICATION" | "PHONE_VERIFICATION" | "PASSWORD_RESET";
export type AppointmentStatus =
  "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
export type PaymentStatus = "PENDING" | "PAID" | "PARTIALLY_PAID" | "REFUNDED" | "FAILED";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "WALLET" | "ONLINE";
export type AiContextType = "GENERAL" | "STAFF" | "PRODUCT" | "SERVICE";
export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "IN_APP";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ";
export type SalonCategory = "MALE" | "FEMALE" | "UNISEX" | "KIDS";
export type DayOfWeek =
  "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type DiscountType = "PERCENTAGE" | "FLAT";
export type LoyaltyTxnType = "EARNED" | "REDEEMED" | "EXPIRED" | "REFUNDED";
export type SalonVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
export type PaymentTxnType = "ADVANCE" | "FINAL" | "REFUND";
export type PayoutStatus = "PENDING" | "PROCESSED" | "FAILED";
export type AccountType = "CUSTOMER" | "SALON_PARTNER";
