/**
 * @swagger
 * /api/v1/auth/otp/send:
 *   post:
 *     summary: Send an authentication OTP
 *     description: Sends a one-minute OTP using exactly one mobile or email identity.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [purpose]
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               purpose:
 *                 type: string
 *                 enum: [LOGIN, SIGNUP]
 *     responses:
 *       200:
 *         description: Generic OTP request success response
 *       400:
 *         description: Invalid request payload
 *       429:
 *         description: OTP request rate limit exceeded
 */

import { NextRequest } from "next/server";

import { getAuthRequestContext } from "@/src/helpers/auth-request";
import { handleApiRouteError } from "@/src/lib/api-route-error";
import { ApiResponse } from "@/src/lib/response";
import { sendOtpService } from "@/src/services/auth/auth.service";
import { sendOtpSchema } from "@/src/validations/auth/auth.validation";

// Support existing generic OTP clients across mobile and email login channels.
export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body supplied by the API client.
    const body = await request.json();

    // Validate identity exclusivity, normalization, and requested purpose.
    const validated = sendOtpSchema.parse(body);

    // Capture request metadata for auth auditing and throttling.
    const context = getAuthRequestContext(request);

    // Pass only identity fields and the validated purpose to the service.
    const result = await sendOtpService(
      { mobile: validated.mobile, email: validated.email },
      validated.purpose,
      context,
    );

    // Preserve the standard successful API response envelope.
    return ApiResponse.success(result);
  } catch (error) {
    // Reuse the shared handler for clean validation and safe server errors.
    return handleApiRouteError(error);
  }
}
