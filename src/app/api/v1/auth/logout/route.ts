// For refresh route
/**
 * @swagger
 * /api/v1/auth/logout:
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
 * LOGOUT API ROUTE
 * Revokes the user's active session by deleting the session record from the DB.
 * ========================================================
 */

import { NextRequest } from "next/server";
import { ApiResponse } from "@/src/lib/response";
import { withAuth } from "@/src/middleware/auth";
import { logoutService } from "@/src/services/auth/auth.service";

export const POST = withAuth(async (req: NextRequest) => {
  // Extract token from the Authorization header
  const authHeader = req.headers.get("authorization")!;

  // Call the service to revoke the session
  await logoutService(authHeader);

  // Return success response
  return ApiResponse.success({ message: "Logged out successfully" });
});
