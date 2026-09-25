import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Deactivates coupons whose validity window has closed.
 *
 * Why:
 * The public validation endpoint already rejects expired coupons at read
 * time, so this job is not a security boundary — it is a hygiene job. It
 * keeps the admin list free of "zombie" coupons that look active but no
 * longer work, and it lets the platform run a future marketing query
 * ("how many coupons expired last month?") without hand-computing dates.
 *
 * Timing:
 * The cutoff is 5 minutes past `validUntil` so a coupon is never flipped
 * off a few milliseconds before a booking on the boundary could legally
 * use it. The public validation endpoint remains the ultimate authority.
 *
 * Idempotency:
 * `updateMany` with `isActive: true` in the WHERE clause means a second
 * run on the same window updates zero rows — safe to retry at will.
 */
export async function runCouponExpiryJob(context: {
  deadline: number;
  hasTimeLeft: () => boolean;
}): Promise<{ processed: number; details: { deactivated: number } }> {
  const cutoff = new Date(Date.now() - 5 * 60 * 1000);

  const result = await prisma.coupon.updateMany({
    where: {
      isActive: true,
      validUntil: { lt: cutoff },
    },
    data: { isActive: false },
  });

  if (!context.hasTimeLeft()) {
    console.warn("Coupon expiry job completed at the time budget boundary", {
      deactivated: result.count,
    });
  }

  return {
    processed: result.count,
    details: { deactivated: result.count },
  };
}
