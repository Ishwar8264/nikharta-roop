import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { getBalance } from "@/server/modules/loyalty/loyalty.service";

/** Returns the caller's loyalty balance and applied rates. */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const balance = await getBalance(auth.sub);
    return NextResponse.json(
      { message: "Balance retrieved", data: { balance } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Loyalty balance failed", error);
    return NextResponse.json(
      { message: "Unable to load balance" },
      { status: 500 },
    );
  }
}
