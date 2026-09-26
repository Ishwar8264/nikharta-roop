import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  ReviewAccessDeniedError,
  ReviewNotFoundError,
} from "@/server/modules/review/review.errors";
import {
  serviceReviewDetailParamSchema,
  updateReviewSchema,
} from "@/server/modules/review/review.schema";
import {
  patchServiceReview,
  removeServiceReview,
} from "@/server/modules/review/review.service";

/** Partially updates the caller's own service review. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ serviceId: string; reviewId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = serviceReviewDetailParamSchema.safeParse(params);
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
    const review = await patchServiceReview(
      auth.sub,
      paramValidation.data.serviceId,
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
    console.error("Service review patch failed", error);
    return NextResponse.json(
      { message: "Unable to update review" },
      { status: 500 },
    );
  }
}

/** Deletes the caller's own service review. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ serviceId: string; reviewId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = serviceReviewDetailParamSchema.safeParse(params);
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
    await removeServiceReview(
      auth.sub,
      paramValidation.data.serviceId,
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
    console.error("Service review delete failed", error);
    return NextResponse.json(
      { message: "Unable to delete review" },
      { status: 500 },
    );
  }
}
