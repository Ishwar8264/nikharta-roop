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
  createSalonCoupon,
  listSalonCoupons,
} from "@/server/modules/coupon/coupon.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";

/** Lists the salon's own coupons. MANAGER+. */
export async function GET(
  request: Request,
  context: { params: Promise<{ salonRef: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = salonRefParamSchema.safeParse(params);

  if (!paramValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: paramValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  const url = new URL(request.url);
  const queryValidation = listCouponsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );

  if (!queryValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: queryValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await listSalonCoupons(
      auth.sub,
      paramValidation.data.salonRef,
      queryValidation.data,
    );

    return NextResponse.json(
      {
        message: "Coupons retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Salon coupon listing failed", error);
    return NextResponse.json(
      { message: "Unable to list coupons" },
      { status: 500 },
    );
  }
}

/**
 * Creates a salon-owned coupon. MANAGER+.
 *
 * Why:
 * The salon scope comes from the URL, never the body — a manager cannot
 * mint platform-wide coupons through this endpoint.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ salonRef: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = salonRefParamSchema.safeParse(params);

  if (!paramValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: paramValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
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

  const bodyValidation = createCouponSchema.safeParse(body);
  if (!bodyValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: bodyValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const coupon = await createSalonCoupon(
      auth.sub,
      paramValidation.data.salonRef,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Coupon created", data: { coupon } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof CouponCodeConflictError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof CouponInvalidDiscountError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Salon coupon creation failed", error);
    return NextResponse.json(
      { message: "Unable to create coupon" },
      { status: 500 },
    );
  }
}
