/**
 * Authentication middleware for protected App Router endpoints.
 * A request must have both a valid JWT and a live database session.
 */

import { NextRequest, NextResponse } from "next/server";

import { getAccessTokenFromRequest } from "@/src/lib/auth-cookies";
import { UnauthorizedError } from "@/src/lib/errors";
import { validateAccessSessionService } from "@/src/services/auth/auth-session.service";

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
      // Support explicit bearer tokens and protected same-origin browser cookies.
      const accessToken = getAccessTokenFromRequest(request);

      // Reject requests that provide neither supported authentication mechanism.
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
