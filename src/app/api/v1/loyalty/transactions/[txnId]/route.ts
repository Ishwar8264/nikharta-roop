import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { LoyaltyTransactionNotFoundError } from "@/server/modules/loyalty/loyalty.errors";
import { transactionParamSchema } from "@/server/modules/loyalty/loyalty.schema";
import { getTransaction } from "@/server/modules/loyalty/loyalty.service";

/** Loads a single loyalty transaction owned by the caller. */
export async function GET(
  request: Request,
  context: { params: Promise<{ txnId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const validation = transactionParamSchema.safeParse(params);
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
    const txn = await getTransaction(auth.sub, validation.data.txnId);
    return NextResponse.json(
      { message: "Transaction retrieved", data: { transaction: txn } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof LoyaltyTransactionNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Loyalty transaction detail failed", error);
    return NextResponse.json(
      { message: "Unable to load transaction" },
      { status: 500 },
    );
  }
}
