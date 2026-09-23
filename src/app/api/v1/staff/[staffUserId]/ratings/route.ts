import { NextResponse } from "next/server";

import { ReviewStaffNotFoundError } from "@/server/modules/review/review.errors";
import {
  listReviewsQuerySchema,
  staffRatingParamSchema,
} from "@/server/modules/review/review.schema";
import { listRatingsForStaff } from "@/server/modules/review/review.service";

/** Public list of staff ratings. */
export async function GET(
  request: Request,
  context: { params: Promise<{ staffUserId: string }> },
): Promise<Response> {
  const params = await context.params;
  const paramValidation = staffRatingParamSchema.safeParse(params);
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
    const result = await listRatingsForStaff(
      paramValidation.data.staffUserId,
      queryValidation.data,
    );
    return NextResponse.json(
      {
        message: "Ratings retrieved",
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
    if (error instanceof ReviewStaffNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Staff rating listing failed", error);
    return NextResponse.json(
      { message: "Unable to list ratings" },
      { status: 500 },
    );
  }
}
