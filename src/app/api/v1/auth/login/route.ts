/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Send a login OTP by mobile or email
 *     description: Accepts exactly one identity. The OTP expires after one minute.
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
 *                     example: "user@example.com"
 *     responses:
 *       200:
 *         description: Generic OTP request success response
 *       400:
 *         description: Invalid request payload
 *       429:
 *         description: OTP request rate limit exceeded
 *       503:
 *         description: Selected OTP delivery provider unavailable
 */

import { NextRequest } from "next/server";

import { getAuthRequestContext } from "@/src/helpers/auth-request";
import { handleApiRouteError } from "@/src/lib/api-route-error";
import { ApiResponse } from "@/src/lib/response";
import { sendOtpService } from "@/src/services/auth/auth.service";
import { loginSchema } from "@/src/validations/auth/auth.validation";

// Initiate a mobile or email OTP login without changing the existing endpoint path.
export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body supplied by the API client.
    const body = await request.json();

    // Validate and normalize exactly one mobile or email identity.
    const validated = loginSchema.parse(body);

    // Capture request metadata for auth auditing and throttling.
    const context = getAuthRequestContext(request);

    // Send a LOGIN-purpose OTP through the selected identity channel.
    const result = await sendOtpService(validated, "LOGIN", context);

    // Preserve the standard successful API response envelope.
    return ApiResponse.success(result);
  } catch (error) {
    // Reuse the shared handler for clean validation and safe server errors.
    return handleApiRouteError(error);
  }
}
