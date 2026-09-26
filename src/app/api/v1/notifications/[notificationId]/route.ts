import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { NotificationNotFoundError } from "@/server/modules/notification/notification.errors";
import { notificationParamSchema } from "@/server/modules/notification/notification.schema";
import {
  markAsRead,
  removeNotification,
} from "@/server/modules/notification/notification.service";

/** Marks a notification as read. */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ notificationId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const validation = notificationParamSchema.safeParse(params);
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
    const notification = await markAsRead(
      auth.sub,
      validation.data.notificationId,
    );
    return NextResponse.json(
      { message: "Notification marked read", data: { notification } },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof NotificationNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Notification mark read failed", error);
    return NextResponse.json(
      { message: "Unable to mark notification read" },
      { status: 500 },
    );
  }
}

/** Deletes a notification. */
export async function DELETE(
  request: Request,
  context: { params: Promise<{ notificationId: string }> },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const validation = notificationParamSchema.safeParse(params);
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
    await removeNotification(auth.sub, validation.data.notificationId);
    return NextResponse.json(
      { message: "Notification deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof NotificationNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    console.error("Notification delete failed", error);
    return NextResponse.json(
      { message: "Unable to delete notification" },
      { status: 500 },
    );
  }
}
