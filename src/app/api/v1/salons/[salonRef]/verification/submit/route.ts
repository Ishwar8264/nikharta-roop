import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";
import {
  VerificationValidationError,
  VerificationConflictError,
  SalonAlreadyVerifiedError,
  SalonVerificationSuspendedError,
} from "@/server/modules/verification/verification.errors";
import { submitVerificationSchema } from "@/server/modules/verification/verification.schema";
import { submitSalonVerification } from "@/server/modules/verification/verification.service";

/**
 * Submits (or resubmits) verification documents. OWNER only.
 *
 * Why:
 * The response echoes the stored row so the UI can show the PENDING state
 * immediately without a follow-up GET.
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

  const bodyValidation = submitVerificationSchema.safeParse(body);
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
    const verification = await submitSalonVerification(
      auth.sub,
      paramValidation.data.salonRef,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Verification submitted", data: { verification } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof VerificationValidationError)
      return NextResponse.json({ message: error.message }, { status: 422 });
    if (error instanceof VerificationConflictError)
      return NextResponse.json({ message: error.message }, { status: 409 });
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof SalonAlreadyVerifiedError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    if (error instanceof SalonVerificationSuspendedError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }

    console.error("Verification submission failed", error);
    return NextResponse.json(
      { message: "Unable to submit verification" },
      { status: 500 },
    );
  }
}
