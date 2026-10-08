import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import {
  CustomerNoteAccessDeniedError,
  CustomerNoteNotFoundError,
} from "@/server/modules/customer-note/customer-note.errors";
import { customerNoteParamsSchema } from "@/server/modules/customer-note/customer-note.schema";
import { deleteCustomerNote } from "@/server/modules/customer-note/customer-note.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { salonRefParamSchema } from "@/server/modules/salon/salon.schema";

/** Deletes a note. Author or MANAGER+. */
export async function DELETE(
  request: Request,
  context: {
    params: Promise<{ salonRef: string; customerId: string; noteId: string }>;
  },
): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth) {
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  }

  const params = await context.params;
  const paramValidation = salonRefParamSchema
    .extend(customerNoteParamsSchema.shape)
    .safeParse(params);

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
    await deleteCustomerNote(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.customerId,
      paramValidation.data.noteId,
    );

    return NextResponse.json(
      { message: "Note deleted", data: null },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }
    if (error instanceof CustomerNoteNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof CustomerNoteAccessDeniedError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Note deletion failed", error);
    return NextResponse.json(
      { message: "Unable to delete note" },
      { status: 500 },
    );
  }
}
