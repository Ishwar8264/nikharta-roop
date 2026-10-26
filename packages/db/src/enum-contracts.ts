import type * as Shared from "@nikharta-roop/shared/enums";
import type * as Database from "./generated/prisma/enums";

/** Fail typechecking if a database enum and its platform-independent contract drift. */
type Equal<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
type Assert<T extends true> = T;
export type EnumContracts = [
  Assert<Equal<Shared.SalonStatus, Database.SalonStatus>>,
  Assert<Equal<Shared.CatalogStatus, Database.CatalogStatus>>,
  Assert<Equal<Shared.PlatformRole, Database.PlatformRole>>,
  Assert<Equal<Shared.MediaPurpose, Database.MediaPurpose>>,
  Assert<Equal<Shared.SalonMemberRole, Database.SalonMemberRole>>,
  Assert<Equal<Shared.OtpChannel, Database.OtpChannel>>,
  Assert<Equal<Shared.OtpPurpose, Database.OtpPurpose>>,
  Assert<Equal<Shared.AppointmentStatus, Database.AppointmentStatus>>,
  Assert<Equal<Shared.PaymentStatus, Database.PaymentStatus>>,
  Assert<Equal<Shared.PaymentMethod, Database.PaymentMethod>>,
  Assert<Equal<Shared.AiContextType, Database.AiContextType>>,
  Assert<Equal<Shared.NotificationChannel, Database.NotificationChannel>>,
  Assert<Equal<Shared.NotificationStatus, Database.NotificationStatus>>,
  Assert<Equal<Shared.SalonCategory, Database.SalonCategory>>,
  Assert<Equal<Shared.DayOfWeek, Database.DayOfWeek>>,
  Assert<Equal<Shared.DiscountType, Database.DiscountType>>,
  Assert<Equal<Shared.LoyaltyTxnType, Database.LoyaltyTxnType>>,
  Assert<Equal<Shared.SalonVerificationStatus, Database.SalonVerificationStatus>>,
  Assert<Equal<Shared.PaymentTxnType, Database.PaymentTxnType>>,
  Assert<Equal<Shared.PayoutStatus, Database.PayoutStatus>>,
  Assert<Equal<Shared.AccountType, Database.AccountType>>,
];
