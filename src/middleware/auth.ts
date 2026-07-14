/**
 * Authentication middleware for protected App Router endpoints.
 * A request must have both a valid JWT and a live database session.
 */

import { NextRequest, NextResponse } from "next/server";

import { UnauthorizedError } from "@/src/lib/errors";
import { validateAccessSessionService } from "@/src/services/auth/auth.service";

// Describe handlers that receive trusted identity claims after session validation.
type AuthHandler = (
  request: NextRequest,
  user: { userId: string; role: string },
) => Promise<NextResponse>;

// Wrap a route handler with Bearer-token and database-session validation.
export const withAuth = (handler: AuthHandler) => {
  // Return the actual Next.js route handler executed for each request.
  return async (request: NextRequest) => {
    try {
      // Read the standard Authorization header from the incoming request.
      const authHeader = request.headers.get("authorization");

      // Require the Bearer scheme before attempting token extraction.
      if (!authHeader?.startsWith("Bearer ")) {
        throw new UnauthorizedError("Missing or invalid authorization header");
      }

      // Extract the raw JWT after the validated Bearer prefix.
      const accessToken = authHeader.slice("Bearer ".length);

      // Reject an empty Bearer value before JWT verification.
      if (!accessToken) {
        throw new UnauthorizedError("Missing access token");
      }

      // Validate JWT claims and confirm the persisted session remains active.
      const decoded = await validateAccessSessionService(accessToken);

      // Execute the protected handler with trusted authorization claims.
      return handler(request, decoded);
    } catch {
      // Return one generic response for invalid, expired, revoked, or blocked sessions.
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }
  };
};
