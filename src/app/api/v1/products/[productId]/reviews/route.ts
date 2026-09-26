import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { ReviewProductNotFoundError } from "@/server/modules/review/review.errors";
import {
  listReviewsQuerySchema,
  productReviewParamSchema,
  upsertReviewSchema,
} from "@/server/modules/review/review.schema";
import {
  createOrReplaceProductReview,
  listReviewsForProduct,
} from "@/server/modules/review/review.service";

export async function GET(
  request: Request,
  context: { params: Promise<{ productId: string }> },
): Promise<Response> {
  const params = await context.params;
  const paramValidation = productReviewParamSchema.safeParse(params);
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
  const queryValidation = listReviewsQuerySchema.safeParse(
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
    const result = await listReviewsForProduct(
      paramValidation.data.productId,
      queryValidation.data,
    );
    return NextResponse.json(
      {
        message: "Reviews retrieved",
        data: result.items,
        meta: {
          summary: result.summary,
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ReviewProductNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Product review listing failed", error);
    return NextResponse.json(
      { message: "Unable to list reviews" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ productId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = productReviewParamSchema.safeParse(params);
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

  const bodyValidation = upsertReviewSchema.safeParse(body);
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
    const review = await createOrReplaceProductReview(
      auth.sub,
      paramValidation.data.productId,
      bodyValidation.data,
    );
    return NextResponse.json(
      { message: "Review saved", data: { review } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ReviewProductNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Product review upsert failed", error);
    return NextResponse.json(
      { message: "Unable to save review" },
      { status: 500 },
    );
  }
}
