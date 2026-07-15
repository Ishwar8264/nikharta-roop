// For refresh route
/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh Access Token
 *     description: Rotates an explicit refresh token or protected browser cookie.
 *     tags: [Auth]
 *     requestBody:
 *       required: false
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

import { getAuthRequestContext } from "@/src/helpers/auth-request";
import { handleApiRouteError } from "@/src/lib/api-route-error";
import {
  getRefreshTokenFromRequest,
  setAuthCookies,
} from "@/src/lib/auth-cookies";
import { UnauthorizedError } from "@/src/lib/errors";
import { ApiResponse } from "@/src/lib/response";
import { refreshTokenService } from "@/src/services/auth/auth.service";
import { refreshTokenSchema } from "@/src/validations/auth/auth.validation";

export async function POST(req: NextRequest) {
  try {
    // 1. Read the optional body because browser refresh can rely on its cookie.
    const rawBody = await req.text();

    // 2. Parse supplied JSON while treating an empty browser body as an object.
    const body: unknown = rawBody ? JSON.parse(rawBody) : {};

    // 3. Validate an optional explicit refresh token for non-browser clients.
    const validated = refreshTokenSchema.parse(body);

    // Prefer an explicit API-client token before the protected browser cookie.
    const refreshToken =
      validated.refreshToken ?? getRefreshTokenFromRequest(req);

    // Reject requests that provide neither supported refresh mechanism.
    if (!refreshToken) {
      throw new UnauthorizedError("Refresh token required");
    }

    // 4. Capture request metadata for the rotated replacement session.
    const context = getAuthRequestContext(req);

    // 5. Call the service layer to rotate the valid refresh session.
    const result = await refreshTokenService(refreshToken, context);

    // 6. Preserve the existing token response for non-browser API clients.
    const response = ApiResponse.success(result);

    // 7. Rotate the protected browser cookies with the replacement token pair.
    setAuthCookies(response, result);

    // 8. Return the response after both browser cookies are attached.
    return response;
  } catch (error) {
    // Keep invalid token details private while reusing standard validation errors.
    return handleApiRouteError(error, {
      fallbackMessage: "Invalid or expired refresh token",
      fallbackStatus: 401,
      logUnexpected: false,
    });
  }
}
