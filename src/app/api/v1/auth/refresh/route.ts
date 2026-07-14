// For refresh route
/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh Access Token
 *     description: Get a new access token using a valid refresh token.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5c..."
 *     responses:
 *       200:
 *         description: New tokens generated successfully
 *       401:
 *         description: Invalid or expired refresh token
 */

/**
 * ========================================================
 * REFRESH TOKEN API ROUTE
 * Allows the client to get a new access token using a valid refresh token.
 * Implements token rotation for enhanced security (old session is revoked).
 * ========================================================
 */

import { NextRequest } from "next/server";
import { ApiResponse } from "@/src/lib/response";
import { refreshTokenService } from "@/src/services/auth/auth.service";
import { refreshTokenSchema } from "@/src/validations/auth/auth.validation";
import { AppError } from "@/src/lib/errors";

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate the request body
    const body = await req.json();
    const validated = refreshTokenSchema.parse(body);

    // 2. Call the service layer to generate new tokens
    const result = await refreshTokenService(validated.refreshToken);

    // 3. Return the new tokens to the client
    return ApiResponse.success(result);
  } catch (error) {
    // TypeScript automatically infers 'error' as 'unknown'. We safely narrow the type below.

    // 1. If it's our custom AppError (e.g., UnauthorizedError), use its specific status code
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode);
    }

    // 2. If it's a standard JavaScript Error (e.g., JWT verification failure or ZodError)
    if (error instanceof Error) {
      // Refresh failures should always return 401 Unauthorized
      return ApiResponse.error(error.message, 401);
    }

    // 3. Fallback for any other unknown error types
    return ApiResponse.error(
      "An unexpected error occurred during token refresh",
      500,
    );
  }
}
