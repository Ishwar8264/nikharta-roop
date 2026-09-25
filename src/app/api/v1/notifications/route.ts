import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { listNotificationsQuerySchema } from "@/server/modules/notification/notification.schema";
import { listNotifications } from "@/server/modules/notification/notification.service";

/** Lists the caller's notification inbox. */
export async function GET(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const url = new URL(request.url);
  const validation = listNotificationsQuerySchema.safeParse(
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
    const result = await listNotifications(auth.sub, validation.data);
    return NextResponse.json(
      {
        message: "Notifications retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Notification listing failed", error);
    return NextResponse.json(
      { message: "Unable to list notifications" },
      { status: 500 },
    );
  }
}
