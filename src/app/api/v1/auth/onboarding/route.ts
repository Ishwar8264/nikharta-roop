import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { getAuthContext } from "@/server/auth/session";
import { AccountDeactivatedError } from "@/server/modules/auth/auth.errors";
import {
  onboardingSchema,
  onboardingDraftSchema,
} from "@/server/modules/auth/onboarding.schema";
import {
  completeOnboarding,
  saveOnboardingIntent,
} from "@/server/modules/auth/onboarding.service";

/** Completes only the authenticated account's setup; roles and memberships are immutable here. */
export async function POST(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth)
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      {
        message: "Check the highlighted fields",
        errors: parsed.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  try {
    const state = await completeOnboarding(auth.sub, parsed.data);
    return NextResponse.json({
      message: "Account setup completed",
      data: state,
    });
  } catch (error) {
    if (error instanceof AccountDeactivatedError)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return NextResponse.json(
        {
          message: "This phone number is already linked to an account",
          errors: [
            { field: "phone", message: "This phone number is already in use" },
          ],
        },
        { status: 409 },
      );
    console.error("Onboarding failed", error);
    return NextResponse.json(
      { message: "Unable to save setup. Please try again." },
      { status: 500 },
    );
  }
}

/** Persists the selected intent without treating a skipped setup as completed. */
export async function PATCH(request: Request): Promise<Response> {
  const auth = await getAuthContext(request);
  if (!auth)
    return NextResponse.json(
      { message: "Authentication required" },
      { status: 401 },
    );
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }
  const parsed = onboardingDraftSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { message: "Choose an account type" },
      { status: 400 },
    );
  try {
    const state = await saveOnboardingIntent(auth.sub, parsed.data);
    return NextResponse.json({ message: "Preference saved", data: state });
  } catch (error) {
    if (error instanceof AccountDeactivatedError)
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return NextResponse.json(
        { message: "This phone number is already linked to an account" },
        { status: 409 },
      );
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    )
      return NextResponse.json(
        { message: "Authentication required" },
        { status: 401 },
      );
    console.error("Onboarding preference failed", error);
    return NextResponse.json(
      { message: "Unable to save your preference. Please try again." },
      { status: 500 },
    );
  }
}
