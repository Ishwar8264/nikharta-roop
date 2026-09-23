import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  ReviewAccessDeniedError,
  ReviewNotFoundError,
} from "@/server/modules/review/review.errors";
import {
  staffRatingDetailParamSchema,
  updateStaffRatingSchema,
} from "@/server/modules/review/review.schema";
import {
  patchStaffRating,
  removeStaffRating,
} from "@/server/modules/review/review.service";

/** Partially updates the caller's own staff rating. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ ratingId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = staffRatingDetailParamSchema.safeParse(params);
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

  const bodyValidation = updateStaffRatingSchema.safeParse(body);
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
    const rating = await patchStaffRating(
      auth.sub,
      paramValidation.data.ratingId,
      bodyValidation.data,
    );
    return NextResponse.json(
      { message: "Rating updated", data: { rating } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ReviewNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof ReviewAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Staff rating patch failed", error);
    return NextResponse.json(
      { message: "Unable to update rating" },
      { status: 500 },
    );
  }
}

/** Deletes the caller's own staff rating. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ ratingId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = staffRatingDetailParamSchema.safeParse(params);
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
    await removeStaffRating(auth.sub, paramValidation.data.ratingId);
    return NextResponse.json(
      { message: "Rating deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ReviewNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof ReviewAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Staff rating delete failed", error);
    return NextResponse.json(
      { message: "Unable to delete rating" },
      { status: 500 },
    );
  }
}
