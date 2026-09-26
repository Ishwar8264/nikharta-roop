import { NextResponse } from "next/server";

import { CouponNotFoundError } from "@/server/modules/coupon/coupon.errors";
import { couponCodeParamSchema } from "@/server/modules/coupon/coupon.schema";
import { getPublicCoupon } from "@/server/modules/coupon/coupon.service";

/**
 * Public coupon lookup by code.
 *
 * Why:
 * Lets a landing page advertise a code and its terms without exposing the
 * admin-only capacity counters. Rate limiting is applied at the proxy level
 * via the standard limiter because this endpoint is anonymous.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ code: string }> },
): Promise<Response> {
  const params = await context.params;
  const validation = couponCodeParamSchema.safeParse(params);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const coupon = await getPublicCoupon(validation.data.code);
    return NextResponse.json(
      { message: "Coupon retrieved", data: { coupon } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof CouponNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Public coupon lookup failed", error);
    return NextResponse.json(
      { message: "Unable to retrieve coupon" },
      { status: 500 },
    );
  }
}
