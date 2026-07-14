/**
 * ========================================================
 * AUTH MIDDLEWARE
 * Protects API routes by verifying the JWT access token.
 * If valid, it injects the user object into the request handler.
 * ========================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { UnauthorizedError } from "../lib/errors";
import { verifyAccessToken } from "../lib/jwt";

// Define a custom type for handlers that receive the authenticated user
type AuthHandler = (
  req: NextRequest,
  user: { userId: string; role: string },
) => Promise<NextResponse>;

/**
 * Higher-order function that wraps an API handler with JWT verification.
 * Extracts the token from the "Authorization: Bearer <token>" header.
 */
export const withAuth = (handler: AuthHandler) => {
  return async (req: NextRequest) => {
    try {
      // 1. Get the Authorization header
      const authHeader = req.headers.get("authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new UnauthorizedError("Missing or invalid authorization header");
      }

      // 2. Extract and verify the token
      const token = authHeader.split(" ")[1];
      const decoded = verifyAccessToken(token);

      // 3. Pass the decoded user data to the original handler
      return handler(req, decoded);
    } catch {
      // If any error occurs (invalid token, expired, etc.), return 401
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }
  };
};
