import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { getUsage } from "@/server/modules/ai/ai.service";

/**
 * Returns the caller's AI quota summary.
 *
 * Why:
 * The client polls this when rendering the chat UI so it can disable the
 * composer and show "used X of Y" before the user tries to send a message
 * that would be rejected. It reads the same counters `enforceQuota` uses.
 */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const usage = await getUsage(auth.sub);

    return NextResponse.json(
      { message: "Usage retrieved", data: { usage } },
      { status: 200 },
    );
  } catch (error) {
    console.error("AI usage lookup failed", error);
    return NextResponse.json(
      { message: "Unable to load AI usage" },
      { status: 500 },
    );
  }
}
