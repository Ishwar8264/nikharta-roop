import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  ReviewAppointmentNotCompletedError,
  ReviewAppointmentNotFoundError,
  ReviewNoStaffToRateError,
  ReviewNotAppointmentCustomerError,
  ReviewStaffRatingExistsError,
} from "@/server/modules/review/review.errors";
import {
  appointmentStaffRatingParamSchema,
  createStaffRatingSchema,
} from "@/server/modules/review/review.schema";
import {
  createStaffRatingForAppointment,
  listStaffRatingsForAppointment,
} from "@/server/modules/review/review.service";

/**
 * Lists the caller's staff ratings for one appointment.
 *
 * Why customer-only:
 * A staff rating is the customer's private feedback about a visit. Only the
 * appointment's customer may read their own ratings here; salon staff read
 * ratings through the staff-scoped public list endpoint.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ appointmentId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = appointmentStaffRatingParamSchema.safeParse(params);
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
    const ratings = await listStaffRatingsForAppointment(
      auth.sub,
      paramValidation.data.appointmentId,
    );
    return NextResponse.json(
      { message: "Ratings retrieved", data: ratings },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof ReviewAppointmentNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof ReviewNotAppointmentCustomerError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    console.error("Staff rating listing failed", error);
    return NextResponse.json(
      { message: "Unable to list ratings" },
      { status: 500 },
    );
  }
}

/** Creates a staff rating bound to a completed appointment. */
export async function POST(
  request: Request,
  context: { params: Promise<{ appointmentId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = appointmentStaffRatingParamSchema.safeParse(params);
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

  const bodyValidation = createStaffRatingSchema.safeParse(body);
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
    const rating = await createStaffRatingForAppointment(
      auth.sub,
      paramValidation.data.appointmentId,
      bodyValidation.data,
    );
    return NextResponse.json(
      { message: "Rating saved", data: { rating } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof ReviewAppointmentNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof ReviewNotAppointmentCustomerError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof ReviewAppointmentNotCompletedError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof ReviewNoStaffToRateError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof ReviewStaffRatingExistsError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Staff rating create failed", error);
    return NextResponse.json(
      { message: "Unable to save rating" },
      { status: 500 },
    );
  }
}
