import "server-only";

import type { DiscountType } from "@/generated/prisma/client";

import { assertRoleAtLeast } from "@/server/modules/salon/salon.authorization";
import { SalonNotFoundError } from "@/server/modules/salon/salon.errors";
import { findSalonForViewer } from "@/server/modules/salon/salon.repository";
import { resolveSalonId } from "@/server/modules/service/service.repository";

import {
  CouponCodeConflictError,
  CouponInvalidDiscountError,
  CouponMinOrderNotMetError,
  CouponNotActiveError,
  CouponNotFoundError,
  CouponPerUserLimitReachedError,
  CouponUsageLimitReachedError,
} from "./coupon.errors";
import { toAdminCouponView, toPublicCouponView } from "./coupon.mapper";
import {
  countUserCouponUsage,
  couponCodeExists,
  createCoupon,
  findCouponByCode,
  findCouponById,
  findPublicCouponByCode,
  listCoupons,
  updateCouponById,
} from "./coupon.repository";
import type {
  AdminCouponView,
  CouponValidationResult,
  CreateCouponInput,
  ListCouponsQuery,
  PaginatedAdminCoupons,
  PublicCouponView,
  UpdateCouponInput,
  ValidateCouponInput,
} from "./coupon.types";

/** Rejects callers that are not SUPER_ADMIN. */
function assertAdmin(role: string): void {
  if (role !== "SUPER_ADMIN") {
    // Reuse the same message as the admin module for consistency.
    const err = new Error(
      "Only platform administrators can perform this action",
    ) as Error & { name?: string };
    err.name = "AdminAccessDeniedError";
    throw err;
  }
}

/**
 * Computes the actual rupee discount for a coupon against a subtotal.
 *
 * Why:
 * Kept as a pure function so both `validate` and `applyToAppointment` share
 * one definition of the math. Percentages are capped by `maxDiscount`; flat
 * discounts are returned as-is, but never exceed the subtotal itself.
 */
export function computeDiscount(
  coupon: {
    discountType: DiscountType;
    discountValue: number;
    maxDiscount: number | null;
  },
  subtotal: number,
): number {
  if (subtotal <= 0) return 0;

  if (coupon.discountType === "PERCENTAGE") {
    const raw = (subtotal * coupon.discountValue) / 100;
    const capped =
      coupon.maxDiscount !== null ? Math.min(raw, coupon.maxDiscount) : raw;
    return Math.min(capped, subtotal);
  }

  // FLAT
  return Math.min(coupon.discountValue, subtotal);
}

/**
 * Evaluates a coupon against a subtotal for the given user.
 *
 * Why:
 * This is the single source of truth for coupon eligibility. The public
 * validate endpoint and the appointment booking path both call it, so a
 * coupon that is valid in one is valid in the other. Returns a structured
 * result instead of throwing so callers can decide how to surface the
 * outcome — the public endpoint returns the reason, the booking path
 * converts a failure into a typed error.
 */
export async function evaluateCoupon(input: {
  code: string;
  subtotal: number;
  userId: string | null;
  /** Salon the coupon is being applied at — required for salon-scoped coupons. */
  salonId?: string | null;
}): Promise<{
  ok: boolean;
  discountAmount: number;
  finalTotal: number;
  reason?: string;
  coupon?: AdminCouponView;
}> {
  const coupon = await findCouponByCode(input.code);
  if (!coupon) {
    return {
      ok: false,
      discountAmount: 0,
      finalTotal: input.subtotal,
      reason: "Coupon not found",
    };
  }

  const view = toAdminCouponView(coupon);
  const now = new Date();

  if (!view.isActive) {
    return {
      ok: false,
      discountAmount: 0,
      finalTotal: input.subtotal,
      reason: "This coupon is not active",
    };
  }

  // Salon-scoped coupons only apply at their own salon. The public validate
  // endpoint has no salon context, so such coupons simply fail there — the
  // booking path supplies the salon id and works normally.
  if (view.salonId && view.salonId !== input.salonId) {
    return {
      ok: false,
      discountAmount: 0,
      finalTotal: input.subtotal,
      reason: "This coupon is not valid for this salon",
    };
  }

  if (now < view.validFrom) {
    return {
      ok: false,
      discountAmount: 0,
      finalTotal: input.subtotal,
      reason: "This coupon is not yet valid",
    };
  }

  if (now > view.validUntil) {
    return {
      ok: false,
      discountAmount: 0,
      finalTotal: input.subtotal,
      reason: "This coupon has expired",
    };
  }

  if (view.usageLimit !== null && view.usedCount >= view.usageLimit) {
    return {
      ok: false,
      discountAmount: 0,
      finalTotal: input.subtotal,
      reason: "This coupon has reached its usage limit",
    };
  }

  if (view.minOrderAmount !== null && input.subtotal < view.minOrderAmount) {
    return {
      ok: false,
      discountAmount: 0,
      finalTotal: input.subtotal,
      reason: `Minimum order amount of ₹${view.minOrderAmount} is required`,
    };
  }

  // Per-user limit is only checked when we have a user to count against.
  if (input.userId) {
    const used = await countUserCouponUsage({
      userId: input.userId,
      couponId: view.id,
    });
    if (used >= view.perUserLimit) {
      return {
        ok: false,
        discountAmount: 0,
        finalTotal: input.subtotal,
        reason: "You have already used this coupon the maximum number of times",
      };
    }
  }

  const discountAmount = computeDiscount(
    {
      discountType: view.discountType,
      discountValue: view.discountValue,
      maxDiscount: view.maxDiscount,
    },
    input.subtotal,
  );

  return {
    ok: true,
    discountAmount,
    finalTotal: input.subtotal - discountAmount,
    coupon: view,
  };
}

/**
 * Public validate endpoint handler.
 *
 * Why:
 * Always returns 200 with a structured body — the client should be able to
 * show "invalid coupon" without branching on HTTP status. The `reason` field
 * carries the human-readable explanation.
 */
export async function validatePublicCoupon(
  userId: string | null,
  input: ValidateCouponInput,
): Promise<CouponValidationResult> {
  const result = await evaluateCoupon({
    code: input.code,
    subtotal: input.subtotal,
    userId,
  });

  return {
    valid: result.ok,
    code: input.code.toUpperCase(),
    discountAmount: result.discountAmount,
    finalTotal: result.finalTotal,
    ...(result.reason ? { reason: result.reason } : {}),
  };
}

/**
 * Throws a typed error for each failure mode of a coupon evaluation.
 *
 * Why:
 * The booking flow needs a specific error class per failure so the route
 * can map to the right HTTP status. Building on `evaluateCoupon` keeps the
 * two call sites from duplicating the check order.
 */
export async function assertCouponUsable(input: {
  code: string;
  subtotal: number;
  userId: string;
  /** Salon the coupon is applied at — enforces salon-scoped coupons. */
  salonId?: string;
}): Promise<{ couponId: string; discountAmount: number }> {
  const result = await evaluateCoupon({
    code: input.code,
    subtotal: input.subtotal,
    userId: input.userId,
    salonId: input.salonId ?? null,
  });

  if (!result.ok || !result.coupon) {
    const reason = result.reason ?? "Coupon is not valid";
    if (reason.includes("not found")) throw new CouponNotFoundError();
    if (reason.includes("usage limit"))
      throw new CouponUsageLimitReachedError();
    if (reason.includes("maximum number of times")) {
      throw new CouponPerUserLimitReachedError();
    }
    if (reason.includes("Minimum order amount")) {
      throw new CouponMinOrderNotMetError(result.coupon?.minOrderAmount ?? 0);
    }
    throw new CouponNotActiveError(reason);
  }

  return {
    couponId: result.coupon.id,
    discountAmount: result.discountAmount,
  };
}

/** Public coupon snapshot by code. */
export async function getPublicCoupon(code: string): Promise<PublicCouponView> {
  const row = await findPublicCouponByCode(code);
  if (!row) throw new CouponNotFoundError();
  return toPublicCouponView(row);
}

// ---------- Admin ----------

/** Lists coupons. SUPER_ADMIN only. */
export async function listAdminCoupons(
  callerRole: string,
  query: ListCouponsQuery,
): Promise<PaginatedAdminCoupons> {
  assertAdmin(callerRole);
  const result = await listCoupons(query);
  return {
    items: result.items.map(toAdminCouponView),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Creates a coupon. SUPER_ADMIN only.
 *
 * Why:
 * The code is normalized to uppercase at the schema layer, so uniqueness is
 * a simple exact-match check. Business-level refinements (percentage range,
 * max discount vs. flat value) already ran in Zod; this function only has to
 * guard against a code collision and persist.
 */
export async function createAdminCoupon(
  callerRole: string,
  input: CreateCouponInput,
): Promise<AdminCouponView> {
  assertAdmin(callerRole);
  return createCouponScoped(input, null);
}

/** Shared create logic — `salonId: null` = platform-wide, set = salon-owned. */
async function createCouponScoped(
  input: CreateCouponInput,
  salonId: string | null,
): Promise<AdminCouponView> {
  const taken = await couponCodeExists(input.code);
  if (taken) throw new CouponCodeConflictError();

  const created = await createCoupon({
    code: input.code,
    description: input.description ?? null,
    discountType: input.discountType,
    discountValue: input.discountValue,
    minOrderAmount: input.minOrderAmount ?? null,
    maxDiscount: input.maxDiscount ?? null,
    usageLimit: input.usageLimit ?? null,
    perUserLimit: input.perUserLimit,
    validFrom: new Date(input.validFrom),
    validUntil: new Date(input.validUntil),
    isActive: input.isActive,
    salonId,
  });

  return toAdminCouponView(created);
}

/**
 * Updates a coupon. SUPER_ADMIN only.
 *
 * Why:
 * Zod already validated the shape of the patch in isolation. Here we
 * additionally re-check the invariants against the merged state — for
 * example, sending a smaller `maxDiscount` alongside a larger existing
 * `discountValue` would fail the cross-field rules that only exist on the
 * create schema.
 */
export async function updateAdminCoupon(
  callerRole: string,
  couponId: string,
  input: UpdateCouponInput,
): Promise<AdminCouponView> {
  assertAdmin(callerRole);
  return updateCouponScoped(couponId, input, null);
}

/**
 * Shared update logic.
 *
 * Why:
 * Zod already validated the shape of the patch in isolation. Here we
 * additionally re-check the invariants against the merged state — for
 * example, sending a smaller `maxDiscount` alongside a larger existing
 * `discountValue` would fail the cross-field rules that only exist on the
 * create schema. The `salonId` argument also scopes the update: an admin may
 * only touch platform-wide coupons, a salon only its own.
 */
async function updateCouponScoped(
  couponId: string,
  input: UpdateCouponInput,
  salonId: string | null,
): Promise<AdminCouponView> {
  const existing = await findCouponById(couponId);
  if (!existing || existing.salonId !== salonId) {
    throw new CouponNotFoundError();
  }

  const merged = {
    discountType: input.discountType ?? existing.discountType,
    discountValue:
      input.discountValue !== undefined
        ? input.discountValue
        : Number(existing.discountValue),
    minOrderAmount:
      input.minOrderAmount !== undefined
        ? input.minOrderAmount
        : existing.minOrderAmount
          ? Number(existing.minOrderAmount)
          : null,
    maxDiscount:
      input.maxDiscount !== undefined
        ? input.maxDiscount
        : existing.maxDiscount
          ? Number(existing.maxDiscount)
          : null,
    validFrom:
      input.validFrom !== undefined
        ? new Date(input.validFrom)
        : existing.validFrom,
    validUntil:
      input.validUntil !== undefined
        ? new Date(input.validUntil)
        : existing.validUntil,
  };

  if (merged.validFrom >= merged.validUntil) {
    throw new CouponInvalidDiscountError("validUntil must be after validFrom");
  }
  if (
    merged.discountType === "PERCENTAGE" &&
    (merged.discountValue <= 0 || merged.discountValue > 100)
  ) {
    throw new CouponInvalidDiscountError(
      "Percentage discount must be between 0 and 100",
    );
  }
  if (
    merged.discountType === "FLAT" &&
    merged.maxDiscount !== null &&
    merged.maxDiscount < merged.discountValue
  ) {
    throw new CouponInvalidDiscountError(
      "Maximum discount cannot be less than the flat discount value",
    );
  }

  const data: Record<string, unknown> = {};
  if (input.description !== undefined) data.description = input.description;
  if (input.discountType !== undefined) data.discountType = input.discountType;
  if (input.discountValue !== undefined) {
    data.discountValue = input.discountValue;
  }
  if (input.minOrderAmount !== undefined) {
    data.minOrderAmount = input.minOrderAmount;
  }
  if (input.maxDiscount !== undefined) data.maxDiscount = input.maxDiscount;
  if (input.usageLimit !== undefined) data.usageLimit = input.usageLimit;
  if (input.perUserLimit !== undefined) data.perUserLimit = input.perUserLimit;
  if (input.validFrom !== undefined) data.validFrom = new Date(input.validFrom);
  if (input.validUntil !== undefined) {
    data.validUntil = new Date(input.validUntil);
  }
  if (input.isActive !== undefined) data.isActive = input.isActive;

  const updated = await updateCouponById(couponId, data);
  return toAdminCouponView(updated);
}

/**
 * Deactivates a coupon. SUPER_ADMIN only.
 *
 * Why:
 * Soft-deactivate rather than delete — historical appointments reference
 * the coupon and deleting the row would orphan those references. The
 * `isActive` flag stops new bookings without touching the audit trail.
 */
export async function deactivateAdminCoupon(
  callerRole: string,
  couponId: string,
): Promise<AdminCouponView> {
  assertAdmin(callerRole);
  return deactivateCouponScoped(couponId, null);
}

/** Shared deactivation — soft, so historical appointments keep their link. */
async function deactivateCouponScoped(
  couponId: string,
  salonId: string | null,
): Promise<AdminCouponView> {
  const existing = await findCouponById(couponId);
  if (!existing || existing.salonId !== salonId) {
    throw new CouponNotFoundError();
  }

  const updated = await updateCouponById(couponId, { isActive: false });
  return toAdminCouponView(updated);
}

// ---------- Salon-owned coupons ----------

/** Loads a salon for a coupon-management operation and asserts MANAGER+. */
async function loadManagedSalon(callerId: string, salonRef: string) {
  const salonId = await resolveSalonId(salonRef);
  if (!salonId) throw new SalonNotFoundError();

  const salon = await findSalonForViewer({ salonId, userId: callerId });
  if (!salon) throw new SalonNotFoundError();

  assertRoleAtLeast(salon.viewerRole, "MANAGER");
  return salonId;
}

/** Lists a salon's own coupons. MANAGER+. */
export async function listSalonCoupons(
  callerId: string,
  salonRef: string,
  query: ListCouponsQuery,
): Promise<PaginatedAdminCoupons> {
  const salonId = await loadManagedSalon(callerId, salonRef);
  const result = await listCoupons({ ...query, salonId });
  return {
    items: result.items.map(toAdminCouponView),
    hasMore: result.hasMore,
    nextCursor: result.nextCursor,
  };
}

/**
 * Creates a salon-owned coupon. MANAGER+.
 *
 * Why:
 * The coupon is pinned to the salon, so it can only ever apply to bookings
 * at that salon (the booking path enforces the scope during evaluation).
 */
export async function createSalonCoupon(
  callerId: string,
  salonRef: string,
  input: CreateCouponInput,
): Promise<AdminCouponView> {
  const salonId = await loadManagedSalon(callerId, salonRef);
  return createCouponScoped(input, salonId);
}

/** Updates one of the salon's own coupons. MANAGER+. */
export async function updateSalonCoupon(
  callerId: string,
  salonRef: string,
  couponId: string,
  input: UpdateCouponInput,
): Promise<AdminCouponView> {
  const salonId = await loadManagedSalon(callerId, salonRef);
  return updateCouponScoped(couponId, input, salonId);
}

/** Deactivates one of the salon's own coupons. MANAGER+. */
export async function deactivateSalonCoupon(
  callerId: string,
  salonRef: string,
  couponId: string,
): Promise<AdminCouponView> {
  const salonId = await loadManagedSalon(callerId, salonRef);
  return deactivateCouponScoped(couponId, salonId);
}
