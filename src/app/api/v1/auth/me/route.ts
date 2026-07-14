/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current logged-in user
 *     description: Returns the authenticated user's profile.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *       401:
 *         description: Unauthorized (Invalid/Expired token)
 */

/**
 * ========================================================
 * GET CURRENT USER (SESSION) API ROUTE
 * Returns the authenticated user's profile data.
 * Requires a valid Bearer token in the Authorization header.
 * ========================================================
 */

import { ApiResponse } from "@/src/lib/response";
import { withAuth } from "@/src/middleware/auth";
import { getMeService } from "@/src/services/auth/auth.service";
import { NextRequest } from "next/server";

// We use the 'withAuth' middleware to automatically verify the token
// and inject the 'user' object ({ userId, role }) into the handler.
export const GET = withAuth(async (req: NextRequest, user) => {
  // Call the service to fetch user details from the database
  const userData = await getMeService(user.userId);

  // Return the user data in a standardized format
  return ApiResponse.success(userData);
});
