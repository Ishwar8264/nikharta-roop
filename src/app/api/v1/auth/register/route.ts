import { registerUserSchema } from "@/server/modules/auth/auth.schema";
import { registerUser } from "@/server/modules/auth/auth.service";
import { RegistrationConflictError } from "@/server/modules/auth/registration-conflict.error";

/**
 * Registers an email-authenticated user with optional phone profile data.
 *
 * Why:
 * The route owns HTTP parsing and status codes while the service owns business
 * rules, which keeps registration reusable outside an HTTP request.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return Response.json(
      { message: "Request body must be valid JSON" },
      { status: 400 },
    );
  }

  const validation = registerUserSchema.safeParse(body);

  if (!validation.success) {
    return Response.json(
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
    const user = await registerUser(validation.data);

    return Response.json(
      {
        message: "User registered successfully",
        data: { user },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof RegistrationConflictError) {
      return Response.json({ message: error.message }, { status: 409 });
    }

    // The public response must not leak database or infrastructure details.
    return Response.json(
      { message: "Unable to register user" },
      { status: 500 },
    );
  }
}
