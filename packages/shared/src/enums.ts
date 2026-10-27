/** Platform-independent enum contracts matching the current Prisma schema. */
export type AiContextType = "GENERAL" | "STAFF" | "PRODUCT" | "SERVICE";
export type AppointmentStatus =
  "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";
export type PaymentStatus = "PENDING" | "PAID" | "PARTIALLY_PAID" | "REFUNDED" | "FAILED";
export type PaymentMethod = "CASH" | "CARD" | "UPI" | "WALLET" | "ONLINE";
export type DiscountType = "PERCENTAGE" | "FLAT";
export type PaymentTxnType = "ADVANCE" | "FINAL" | "REFUND";
export type PayoutStatus = "PENDING" | "PROCESSED" | "FAILED";
export type ContentFormat = "TEXT" | "HTML" | "JSON";
export type CatalogStatus = "DRAFT" | "PUBLISHED" | "PAUSED" | "ARCHIVED";
export type ProfileType = "PERSONAL" | "SALON";
export type ProfileStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "ARCHIVED";
export type OnboardingStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED";
export type FeedPostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "REMOVED";
export type SalonStatus = "DRAFT" | "LIVE" | "TEMPORARILY_CLOSED" | "ARCHIVED";
export type SalonMemberRole = "OWNER" | "MANAGER" | "STAFF";
export type SalonCategory = "MALE" | "FEMALE" | "UNISEX" | "KIDS";
export type DayOfWeek =
  "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY";
export type SalonVerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
export type MediaPurpose =
  "VERIFICATION" | "GENERAL" | "SALON" | "PRODUCT" | "SERVICE" | "BLOG" | "AVATAR" | "REVIEW";
export type LoyaltyTxnType = "EARNED" | "REDEEMED" | "EXPIRED" | "REFUNDED";
export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP" | "PUSH" | "IN_APP";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED" | "READ";
export type PlatformRole = "ADMIN" | "CONTENT_ADMIN" | "USER";
export type OtpChannel = "EMAIL" | "SMS" | "WHATSAPP" | "VOICE";
export type OtpTarget = "EMAIL" | "PHONE";
export type OtpStatus =
  "PENDING" | "SENT" | "DELIVERED" | "VERIFIED" | "FAILED" | "EXPIRED" | "CANCELLED";
export type UserStatus =
  | "PENDING_VERIFICATION"
  | "ACTIVE"
  | "SUSPENDED"
  | "BANNED"
  | "DEACTIVATED"
  | "PENDING_DELETION"
  | "DELETED";
export type OtpPurpose =
  | "REGISTRATION"
  | "LOGIN"
  | "PASSWORD_RESET"
  | "CONTACT_VERIFICATION"
  | "CONTACT_CHANGE"
  | "SECURE_ACTION"
  | "STAFF_ACTIVATION";
export type AccountType = "CUSTOMER" | "SALON_PARTNER";
