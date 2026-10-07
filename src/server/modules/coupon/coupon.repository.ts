import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Full coupon select for admin views.
 *
 * Why:
 * The admin dashboard shows usage against the limit, so `usedCount` and
 * `usageLimit` travel together. Every other field is returned verbatim; the
 * mapper normalizes Decimal to number.
 */
const ADMIN_COUPON_SELECT = {
  id: true,
  code: true,
  description: true,
  discountType: true,
  discountValue: true,
  minOrderAmount: true,
  maxDiscount: true,
  usageLimit: true,
  usedCount: true,
  perUserLimit: true,
  validFrom: true,
  validUntil: true,
  isActive: true,
  createdAt: true,
} as const satisfies Prisma.CouponSelect;

/**
 * Public snapshot select.
 *
 * Why:
 * The public endpoint exposes just enough for the client to display the
 * offer and decide whether to keep it. `usedCount` and `usageLimit` are
 * intentionally absent — they are internal capacity signals, not customer
 * information.
 */
const PUBLIC_COUPON_SELECT = {
  code: true,
  description: true,
  discountType: true,
  discountValue: true,
  minOrderAmount: true,
  maxDiscount: true,
  validUntil: true,
  isActive: true,
} as const satisfies Prisma.CouponSelect;

/** Cursor-paginated admin listing. */
export async function listCoupons(input: {
  cursor?: string;
  limit: number;
  search?: string;
  isActive?: boolean;
}) {
  const where: Prisma.CouponWhereInput = {
    ...(input.search
      ? { code: { contains: input.search.toUpperCase(), mode: "insensitive" } }
      : {}),
    ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
  };

  const rows = await prisma.coupon.findMany({
    where,
    select: ADMIN_COUPON_SELECT,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take: input.limit + 1,
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
  });

  const hasMore = rows.length > input.limit;
  const items = hasMore ? rows.slice(0, input.limit) : rows;

  return {
    items,
    hasMore,
    nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
  };
}

/** Loads a coupon by id (admin surface). */
export async function findCouponById(id: string) {
  return prisma.coupon.findUnique({
    where: { id },
    select: ADMIN_COUPON_SELECT,
  });
}

/**
 * Loads a coupon by code.
 *
 * Why:
 * Called by the public validate endpoint and by the appointment booking
 * flow. Case is normalized to uppercase here so callers never have to think
 * about it — the schema already uppercases incoming input, and this guard
 * handles internal callers that pass a raw string.
 */
export async function findCouponByCode(code: string) {
  return prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    select: ADMIN_COUPON_SELECT,
  });
}

/** Returns the public snapshot for a code, or null. */
export async function findPublicCouponByCode(code: string) {
  return prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    select: PUBLIC_COUPON_SELECT,
  });
}

/** Persists a new coupon. */
export async function createCoupon(data: Prisma.CouponUncheckedCreateInput) {
  return prisma.coupon.create({
    data,
    select: ADMIN_COUPON_SELECT,
  });
}

/** Applies a partial update to a coupon. */
export async function updateCouponById(
  id: string,
  data: Prisma.CouponUncheckedUpdateInput,
) {
  return prisma.coupon.update({
    where: { id },
    data,
    select: ADMIN_COUPON_SELECT,
  });
}

/**
 * Counts the caller's non-cancelled appointments that used a coupon.
 *
 * Why:
 * `perUserLimit` should be enforced against appointments that actually
 * consumed the offer. Cancelled bookings free up the slot so the user can
 * try again, but a scheduled or completed booking counts forever.
 */
export async function countUserCouponUsage(input: {
  userId: string;
  couponId: string;
}): Promise<number> {
  return prisma.appointment.count({
    where: {
      customerId: input.userId,
      couponId: input.couponId,
      status: { notIn: ["CANCELLED"] },
    },
  });
}

/**
 * Atomically reserves one usage slot on the coupon.
 *
 * Why:
 * Two concurrent bookings must not both pass a "usedCount < usageLimit"
 * read-then-write check. Guarding the increment with a conditional
 * `updateMany` makes the database the arbiter — exactly one write succeeds
 * when the limit would be exceeded.
 *
 * `userId` folds the per-user limit into the same reservation. Counting the
 * user's appointments inside the caller's serializable transaction means a
 * concurrent second booking for the same user is arbitrated by the database
 * (predicate conflict aborts one of them) instead of racing a separate
 * read outside the transaction.
 *
 * Returns true on success, false when the coupon has reached its limit.
 */
export async function tryReserveCouponSlot(
  transaction: Prisma.TransactionClient,
  couponId: string,
  userId?: string,
): Promise<boolean> {
  const coupon = await transaction.coupon.findUnique({
    where: { id: couponId },
    select: { perUserLimit: true },
  });
  if (!coupon) return false;

  if (userId) {
    const userUsage = await transaction.appointment.count({
      where: {
        customerId: userId,
        couponId,
        status: { notIn: ["CANCELLED"] },
      },
    });
    if (userUsage > coupon.perUserLimit) return false;
  }

  const updated = await transaction.coupon.updateMany({
    where: {
      id: couponId,
      // The WHERE clause embodies the limit check.
      // When `usageLimit` is null the coupon is unlimited, so we accept any
      // row (usedCount >= 0 is always true).
      OR: [
        { usageLimit: null },
        { usedCount: { lt: prisma.coupon.fields.usageLimit } },
      ],
    },
    data: { usedCount: { increment: 1 } },
  });

  return updated.count === 1;
}

/**
 * Releases a previously reserved slot.
 *
 * Why:
 * Called when an appointment that reserved a coupon slot is cancelled, so
 * the platform-wide usage limit reflects reality. `updateMany` with a guard
 * of `usedCount > 0` keeps the counter from going negative.
 */
export async function releaseCouponSlot(couponId: string): Promise<void> {
  await prisma.coupon.updateMany({
    where: { id: couponId, usedCount: { gt: 0 } },
    data: { usedCount: { decrement: 1 } },
  });
}

/** Returns true when the code is already taken. */
export async function couponCodeExists(code: string): Promise<boolean> {
  const found = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
    select: { id: true },
  });
  return found !== null;
}
