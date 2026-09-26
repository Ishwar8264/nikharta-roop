import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  CouponCodeConflictError,
  CouponInvalidDiscountError,
} from "@/server/modules/coupon/coupon.errors";
import {
  createCouponSchema,
  listCouponsQuerySchema,
} from "@/server/modules/coupon/coupon.schema";
import {
  createAdminCoupon,
  listAdminCoupons,
} from "@/server/modules/coupon/coupon.service";

/** Lists coupons. SUPER_ADMIN only. */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const validation = listCouponsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

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
    const result = await listAdminCoupons(auth.role, validation.data);
    return NextResponse.json(
      {
        message: "Coupons retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    if (isAdminDenied(error)) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Coupon listing failed", error);
    return NextResponse.json(
      { message: "Unable to list coupons" },
      { status: 500 },
    );
  }
}

/** Creates a coupon. SUPER_ADMIN only. */
export async function POST(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const validation = createCouponSchema.safeParse(body);
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
    const coupon = await createAdminCoupon(auth.role, validation.data);
    return NextResponse.json(
      { message: "Coupon created", data: { coupon } },
      { status: 201 },
    );
  } catch (error) {
    if (isAdminDenied(error)) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof CouponCodeConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof CouponInvalidDiscountError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Coupon creation failed", error);
    return NextResponse.json(
      { message: "Unable to create coupon" },
      { status: 500 },
    );
  }
}

/** Detects the AdminAccessDeniedError thrown from the coupon service. */
function isAdminDenied(error: unknown): error is Error {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AdminAccessDeniedError"
  );
}
