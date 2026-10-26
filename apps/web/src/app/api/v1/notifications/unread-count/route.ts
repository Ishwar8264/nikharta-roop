import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { getUnreadCount } from "@/server/modules/notification/notification.service";

/** Returns the caller's unread notification count. */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const count = await getUnreadCount(auth.sub);
    return NextResponse.json(
      { message: "Unread count retrieved", data: { count } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Unread count failed", error);
    return NextResponse.json(
      { message: "Unable to load unread count" },
      { status: 500 },
    );
  }
}
