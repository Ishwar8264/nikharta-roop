import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  LoyaltyInsufficientPointsError,
  LoyaltyInvalidAmountError,
} from "@/server/modules/loyalty/loyalty.errors";
import { redeemPointsSchema } from "@/server/modules/loyalty/loyalty.schema";
import { redeemPointsForDiscount } from "@/server/modules/loyalty/loyalty.service";

/** Redeems points and returns the rupee discount. */
export async function POST(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
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

  const validation = redeemPointsSchema.safeParse(body);
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await redeemPointsForDiscount(auth.sub, validation.data);
    return NextResponse.json(
      { message: "Points redeemed", data: result },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof LoyaltyInvalidAmountError) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof LoyaltyInsufficientPointsError) {
      return NextResponse.json({ message: error.message }, { status: 409 });
    }
    console.error("Loyalty redeem failed", error);
    return NextResponse.json(
      { message: "Unable to redeem points" },
      { status: 500 },
    );
  }
}
