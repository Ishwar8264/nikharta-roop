import { NextResponse } from "next/server";

import { getAuthContext } from "@/server/auth/session";
import { createCustomerNoteSchema } from "@/server/modules/customer-note/customer-note.schema";
import {
  createCustomerNote,
  listCustomerNotes,
} from "@/server/modules/customer-note/customer-note.service";
import {
  SalonNotFoundError,
  SalonRoleInsufficientError,
} from "@/server/modules/salon/salon.errors";
import { resourceIdSchema, salonRefParamSchema } from "@/server/modules/salon/salon.schema";

/** Lists a customer's notes. STAFF+. */
export async function GET(
  request: Request,
  context: { params: Promise<{ salonRef: string; customerId: string }> },
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
    .extend({ customerId: resourceIdSchema })
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
    const notes = await listCustomerNotes(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.customerId,
    );

    return NextResponse.json(
      { message: "Notes retrieved", data: notes },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Note listing failed", error);
    return NextResponse.json(
      { message: "Unable to list notes" },
      { status: 500 },
    );
  }
}

/** Creates a note about a customer. STAFF+. */
export async function POST(
  request: Request,
  context: { params: Promise<{ salonRef: string; customerId: string }> },
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
    .extend({ customerId: resourceIdSchema })
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const bodyValidation = createCustomerNoteSchema.safeParse(body);
  if (!bodyValidation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: bodyValidation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const note = await createCustomerNote(
      auth.sub,
      paramValidation.data.salonRef,
      paramValidation.data.customerId,
      bodyValidation.data,
    );

    return NextResponse.json(
      { message: "Note created", data: { note } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof SalonNotFoundError) {
      return NextResponse.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof SalonRoleInsufficientError) {
      return NextResponse.json({ message: error.message }, { status: 403 });
    }

    console.error("Note creation failed", error);
    return NextResponse.json(
      { message: "Unable to create note" },
      { status: 500 },
    );
  }
}
