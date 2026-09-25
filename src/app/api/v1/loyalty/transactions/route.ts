import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { listTransactionsQuerySchema } from "@/server/modules/loyalty/loyalty.schema";
import { listTransactions } from "@/server/modules/loyalty/loyalty.service";

/** Lists the caller's loyalty ledger. */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const validation = listTransactionsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
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
    const result = await listTransactions(auth.sub, validation.data);
    return NextResponse.json(
      {
        message: "Transactions retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Loyalty transactions failed", error);
    return NextResponse.json(
      { message: "Unable to list transactions" },
      { status: 500 },
    );
  }
}
