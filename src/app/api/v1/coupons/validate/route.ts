import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { validateCouponSchema } from "@/server/modules/coupon/coupon.schema";
import { validatePublicCoupon } from "@/server/modules/coupon/coupon.service";

/**
 * Public coupon validation.
 *
 * Why:
 * Always responds with 200 — the body carries `valid: boolean` and a
 * `reason` string for the invalid case. The client should show the reason
 * inline in the checkout summary, not branch on HTTP status.
 *
 * Authentication is optional: a signed-in user's per-user limit is
 * enforced; an anonymous visitor still gets the platform-wide check.
 */
export async function POST(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const validation = validateCouponSchema.safeParse(body);
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
    const result = await validatePublicCoupon(
      auth?.sub ?? null,
      validation.data,
    );
    return NextResponse.json(
      { message: "Coupon validated", data: result },
      { status: 200 },
    );
  } catch (error) {
    console.error("Coupon validation failed", error);
    return NextResponse.json(
      { message: "Unable to validate coupon" },
      { status: 500 },
    );
  }
}
