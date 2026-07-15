// For refresh route
/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Log out the current session
 *     description: Revokes the bearer-token or browser-cookie session.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Session revoked and browser cookies cleared
 *       401:
 *         description: Missing, invalid, or expired session
 */

/**
 * ========================================================
 * LOGOUT API ROUTE
 * Revokes the user's active session by deleting the session record from the DB.
 * ========================================================
 */

import { NextRequest } from "next/server";
import {
  clearAuthCookies,
  getAccessTokenFromRequest,
} from "@/src/lib/auth-cookies";
import { ApiResponse } from "@/src/lib/response";
import { withAuth } from "@/src/middleware/auth";
import { logoutService } from "@/src/services/auth/auth.service";

export const POST = withAuth(async (req: NextRequest) => {
  // Reuse the token source already accepted by the authentication middleware.
  const accessToken = getAccessTokenFromRequest(req)!;

  // Call the service to revoke the session
  await logoutService(accessToken);

  // Build the standard logout response before clearing browser credentials.
  const response = ApiResponse.success({ message: "Logged out successfully" });

  // Clear both HttpOnly cookies so browser logout completes immediately.
  clearAuthCookies(response);

  // Return the successful response after browser credentials are removed.
  return response;
});
