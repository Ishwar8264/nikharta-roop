import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { ReviewServiceNotFoundError } from "@/server/modules/review/review.errors";
import {
  listReviewsQuerySchema,
  serviceReviewParamSchema,
  upsertReviewSchema,
} from "@/server/modules/review/review.schema";
import {
  createOrReplaceServiceReview,
  listReviewsForService,
} from "@/server/modules/review/review.service";

/** Public list of service reviews. */
export async function GET(
  request: Request,
  context: { params: Promise<{ serviceId: string }> },
): Promise<Response> {
  const params = await context.params;
  const paramValidation = serviceReviewParamSchema.safeParse(params);
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
    const result = await listReviewsForService(
      paramValidation.data.serviceId,
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
    if (error instanceof ReviewServiceNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Service review listing failed", error);
    return NextResponse.json(
      { message: "Unable to list reviews" },
      { status: 500 },
    );
  }
}

/** Creates or replaces the caller's own service review. */
export async function POST(
  request: Request,
  context: { params: Promise<{ serviceId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = serviceReviewParamSchema.safeParse(params);
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
    const review = await createOrReplaceServiceReview(
      auth.sub,
      paramValidation.data.serviceId,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Review saved", data: { review } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ReviewServiceNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Service review upsert failed", error);
    return NextResponse.json(
      { message: "Unable to save review" },
      { status: 500 },
    );
  }
}
