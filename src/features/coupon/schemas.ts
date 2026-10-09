import { z } from "zod";

import { siteConfig } from "@/config/site";
import { appointmentPriceFormatter } from "@/features/appointment/format";

import type { DiscountType } from "./types";

/**
 * Browser-safe mirror of `src/server/modules/coupon/coupon.schema.ts`.
 *
 * Why not import the server schema directly:
 * The wiring doc forbids importing `src/server/**` into Client Components. The
 * server module also drags in `salon.schema`'s `resourceIdSchema`, which has no
 * business on the client. We re-declare the same rules here so the form
 * validates exactly the way the API will, without leaking server code into the
 * browser bundle.
 *
 * Keep these rules in sync with the server schema whenever it changes. The
 * regex below MUST match `couponCodeSchema`'s `/^[A-Z0-9-]+$/i` exactly.
 */
const COUPON_CODE_REGEX = /^[A-Z0-9-]+$/;

const discountTypeEnum = z.enum(["PERCENTAGE", "FLAT"]);

export const couponFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must contain at least 3 characters")
      .max(32, "Code must contain at most 32 characters")
      .regex(
        COUPON_CODE_REGEX,
        "Code may contain only letters, digits, and hyphens",
      )
      .transform((value) => value.toUpperCase()),
    description: z
      .string()
      .trim()
      .max(500, "Description must contain at most 500 characters")
      .optional(),
    discountType: discountTypeEnum,
    discountValue: z
      .number()
      .positive("Discount value must be greater than 0")
      .max(1_000_000, "Discount value is too large"),
    minOrderAmount: z
      .number()
      .nonnegative("Minimum order amount cannot be negative")
      .max(10_000_000, "Minimum order amount is too large")
      .optional(),
    maxDiscount: z
      .number()
      .positive("Maximum discount must be greater than 0")
      .max(10_000_000, "Maximum discount is too large")
      .optional(),
    usageLimit: z
      .number()
      .int("Usage limit must be an integer")
      .positive("Usage limit must be greater than 0")
      .max(10_000_000, "Usage limit is too large")
      .optional(),
    perUserLimit: z
      .number()
      .int("Per-user limit must be an integer")
      .positive("Per-user limit must be greater than 0")
      .max(1000, "Per-user limit is too large")
      .default(1),
    /**
     * `datetime-local` inputs return "YYYY-MM-DDTHH:mm" with no timezone. We
     * accept that raw shape here (string + non-empty) and convert to a proper
     * ISO-with-offset string at submit time via `toIsoWithOffset` below.
     */
    validFrom: z.string().min(1, "Start date is required"),
    validUntil: z.string().min(1, "End date is required"),
    isActive: z.boolean().default(true),
  })
  .refine((input) => new Date(input.validFrom) < new Date(input.validUntil), {
    message: "End date must be after the start date.",
    path: ["validUntil"],
  })
  .refine(
    (input) =>
      input.discountType !== "PERCENTAGE" ||
      (input.discountValue > 0 && input.discountValue <= 100),
    {
      message: "Percentage discount must be between 0 and 100.",
      path: ["discountValue"],
    },
  )
  .refine(
    (input) =>
      input.discountType !== "FLAT" ||
      input.maxDiscount === undefined ||
      input.maxDiscount >= input.discountValue,
    {
      message:
        "Maximum discount cannot be less than the flat discount value.",
      path: ["maxDiscount"],
    },
  );

export type CouponFormInput = z.input<typeof couponFormSchema>;
export type CouponFormValues = z.output<typeof couponFormSchema>;

/** Formats a `datetime-local` input value as an ISO string with local offset. */
export function toIsoWithOffset(localValue: string): string {
  const date = new Date(localValue);
  if (Number.isNaN(date.getTime())) return localValue;
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  // `getTimezoneOffset()` returns minutes such that UTC = local + offset.
  // For IST it returns -330 (local is 5h30m ahead of UTC).
  const tzMinutes = date.getTimezoneOffset();
  const sign = tzMinutes <= 0 ? "+" : "-";
  const abs = Math.abs(tzMinutes);
  const tzh = pad(Math.floor(abs / 60));
  const tzm = pad(abs % 60);
  return `${y}-${mo}-${d}T${h}:${mi}:00.000${sign}${tzh}:${tzm}`;
}

/** Inverse of `toIsoWithOffset` — accepts any ISO/UTC string the server sends. */
export function toDatetimeLocal(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  return `${y}-${mo}-${d}T${h}:${mi}`;
}

const couponDateTimeFormatter = new Intl.DateTimeFormat(siteConfig.locale, {
  dateStyle: "medium",
  timeStyle: "short",
});

/** Formats an ISO timestamp as "12 Oct 2026, 4:30 pm" using the site locale. */
export function formatCouponDateTime(value: string | Date): string {
  return couponDateTimeFormatter.format(new Date(value));
}

/**
 * Builds the single-line summary shown in the table and form preview:
 * "20% off · min ₹999 · max ₹200 off" or "₹200 off · min ₹999".
 */
export function buildDiscountSummary(coupon: {
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
}): string {
  const parts: string[] = [];
  if (coupon.discountType === "PERCENTAGE") {
    parts.push(`${coupon.discountValue}% off`);
  } else {
    parts.push(`${appointmentPriceFormatter.format(coupon.discountValue)} off`);
  }
  if (coupon.minOrderAmount != null) {
    parts.push(`min ${appointmentPriceFormatter.format(coupon.minOrderAmount)}`);
  }
  if (coupon.discountType === "PERCENTAGE" && coupon.maxDiscount != null) {
    parts.push(
      `max ${appointmentPriceFormatter.format(coupon.maxDiscount)} off`,
    );
  }
  return parts.join(" · ");
}
