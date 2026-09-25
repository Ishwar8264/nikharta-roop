import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  CouponInvalidDiscountError,
  CouponNotFoundError,
} from "@/server/modules/coupon/coupon.errors";
import {
  couponIdParamSchema,
  updateCouponSchema,
} from "@/server/modules/coupon/coupon.schema";
import {
  deactivateAdminCoupon,
  updateAdminCoupon,
} from "@/server/modules/coupon/coupon.service";

/** Updates a coupon. SUPER_ADMIN only. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ couponId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = couponIdParamSchema.safeParse(params);
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

  const bodyValidation = updateCouponSchema.safeParse(body);
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
    const coupon = await updateAdminCoupon(
      auth.role,
      paramValidation.data.couponId,
      bodyValidation.data,
    );
    return NextResponse.json(
      { message: "Coupon updated", data: { coupon } },
      { status: 200 },
    );
  } catch (error) {
    if (isAdminDenied(error)) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof CouponNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof CouponInvalidDiscountError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    console.error("Coupon update failed", error);
    return NextResponse.json(
      { message: "Unable to update coupon" },
      { status: 500 },
    );
  }
}

/** Deactivates a coupon. SUPER_ADMIN only. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ couponId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = couponIdParamSchema.safeParse(params);
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

  try {
    const coupon = await deactivateAdminCoupon(
      auth.role,
      paramValidation.data.couponId,
    );
    return NextResponse.json(
      { message: "Coupon deactivated", data: { coupon } },
      { status: 200 },
    );
  } catch (error) {
    if (isAdminDenied(error)) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof CouponNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Coupon deactivation failed", error);
    return NextResponse.json(
      { message: "Unable to deactivate coupon" },
      { status: 500 },
    );
  }
}

function isAdminDenied(error: unknown): error is Error {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AdminAccessDeniedError"
  );
}
