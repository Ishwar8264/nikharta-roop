import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { markAllAsRead } from "@/server/modules/notification/notification.service";

/** Marks every unread notification as read. */
export async function PATCH(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  try {
    const count = await markAllAsRead(auth.sub);
    return NextResponse.json(
      { message: "All notifications marked read", data: { count } },
      { status: 200 },
    );
  } catch (error) {
    console.error("Mark all read failed", error);
    return NextResponse.json(
      { message: "Unable to mark notifications read" },
      { status: 500 },
    );
  }
}
