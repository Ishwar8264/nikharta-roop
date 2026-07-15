/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user through mobile or email OTP
 *     description: Sends a one-minute signup OTP using exactly one identity.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [mobile]
 *                 properties:
 *                   mobile:
 *                     type: string
 *                     example: "9876543210"
 *               - type: object
 *                 required: [email]
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "new-user@example.com"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       409:
 *         description: Mobile or email already registered
 *       429:
 *         description: OTP request rate limit exceeded
 */

import { NextRequest } from "next/server";

import { getAuthRequestContext } from "@/src/helpers/auth-request";
import { handleApiRouteError } from "@/src/lib/api-route-error";
import { ApiResponse } from "@/src/lib/response";
import { sendOtpService } from "@/src/services/auth/auth.service";
import { registerSchema } from "@/src/validations/auth/auth.validation";

// Initiate account registration through exactly one mobile or email identity.
export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body supplied by the API client.
    const body = await request.json();

    // Validate and normalize exactly one mobile or email signup identity.
    const validated = registerSchema.parse(body);

    // Capture request metadata for auth auditing and throttling.
    const context = getAuthRequestContext(request);

    // Send a SIGNUP-purpose OTP through the selected identity channel.
    const result = await sendOtpService(validated, "SIGNUP", context);

    // Preserve the standard successful API response envelope.
    return ApiResponse.success(result);
  } catch (error) {
    // Reuse the shared handler for clean validation and safe server errors.
    return handleApiRouteError(error);
  }
}
