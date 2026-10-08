import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";
import { SalonVerificationNotFoundError } from "@/server/modules/verification/verification.errors";
import { getSalonVerification } from "@/server/modules/verification/verification.service";

/** Returns the salon's verification status. MANAGER+. */
export async function GET(
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

  try {
    const verification = await getSalonVerification(
      auth.sub,
      paramValidation.data.salonRef,
    );

    return NextResponse.json(
      { message: "Verification retrieved", data: { verification } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof SalonVerificationNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }

    console.error("Verification fetch failed", error);
    return NextResponse.json(
      { message: "Unable to retrieve verification" },
      { status: 500 },
    );
  }
}
