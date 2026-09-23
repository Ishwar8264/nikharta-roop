import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  ReviewAccessDeniedError,
  ReviewNotFoundError,
} from "@/server/modules/review/review.errors";
import {
  productReviewDetailParamSchema,
  updateReviewSchema,
} from "@/server/modules/review/review.schema";
import {
  patchProductReview,
  removeProductReview,
} from "@/server/modules/review/review.service";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ productId: string; reviewId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = productReviewDetailParamSchema.safeParse(params);
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

  const bodyValidation = updateReviewSchema.safeParse(body);
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
    const review = await patchProductReview(
      auth.sub,
      paramValidation.data.productId,
      paramValidation.data.reviewId,
      bodyValidation.data,
    );
    return NextResponse.json(
      { message: "Review updated", data: { review } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ReviewNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof ReviewAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Product review patch failed", error);
    return NextResponse.json(
      { message: "Unable to update review" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ productId: string; reviewId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = productReviewDetailParamSchema.safeParse(params);
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
    await removeProductReview(
      auth.sub,
      paramValidation.data.productId,
      paramValidation.data.reviewId,
    );
    return NextResponse.json(
      { message: "Review deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ReviewNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof ReviewAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Product review delete failed", error);
    return NextResponse.json(
      { message: "Unable to delete review" },
      { status: 500 },
    );
  }
}
