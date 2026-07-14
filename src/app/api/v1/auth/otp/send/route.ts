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
import { AppError } from "@/src/lib/errors";
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
    // Preserve status codes from expected application failures.
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode);
    }

    // Return validation and malformed JSON failures as bad requests.
    if (error instanceof Error) {
      return ApiResponse.error(error.message, 400);
    }

    // Hide unknown runtime details behind one safe server response.
    return ApiResponse.error("An unexpected error occurred", 500);
  }
}
