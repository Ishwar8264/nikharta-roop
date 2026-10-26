import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { AdminAccessDeniedError } from "@/server/modules/admin/admin.errors";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";
import {
  VerificationValidationError,
  VerificationConflictError,
  SalonAlreadyVerifiedError,
  SalonVerificationNotFoundError,
} from "@/server/modules/verification/verification.errors";
import { reviewVerificationSchema } from "@/server/modules/verification/verification.schema";
import { reviewSalonVerification } from "@/server/modules/verification/verification.service";

/**
 * Applies an admin decision to a salon's verification.
 *
 * Why this lives under `/admin`:
 * The proxy gates the whole `/api/v1/admin/*` prefix to SUPER_ADMIN, so an
 * unauthenticated or non-admin request never reaches this handler.
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

  const bodyValidation = reviewVerificationSchema.safeParse(body);
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
    const verification = await reviewSalonVerification(
      auth.sub,
      auth.role,
      paramValidation.data.salonRef,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Verification reviewed", data: { verification } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof VerificationValidationError)
      return NextResponse.json({ message: error.message }, { status: 422 });
    if (error instanceof VerificationConflictError)
      return NextResponse.json({ message: error.message }, { status: 409 });
    if (error instanceof AdminAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof SalonVerificationNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonAlreadyVerifiedError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Verification review failed", error);
    return NextResponse.json(
      { message: "Unable to review verification" },
      { status: 500 },
    );
  }
}
