/**
 * @swagger
 * /api/v1/auth/otp/verify:
 *   post:
 *     summary: Verify a mobile or email OTP
 *     description: Claims one unexpired OTP and returns a new JWT session.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp, purpose]
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "user@example.com"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               purpose:
 *                 type: string
 *                 enum: [LOGIN, SIGNUP]
 *     responses:
 *       200:
 *         description: OTP verified and JWT session created
 *       400:
 *         description: Invalid, expired, reused, or locked OTP
 *       401:
 *         description: Incorrect OTP or authentication failure
 */

import { NextRequest } from "next/server";

import { getAuthRequestContext } from "@/src/helpers/auth-request";
import { AppError } from "@/src/lib/errors";
import { ApiResponse } from "@/src/lib/response";
import { verifyOtpService } from "@/src/services/auth/auth.service";
import { verifyOtpSchema } from "@/src/validations/auth/auth.validation";

// Complete mobile signup or mobile/email login after OTP proof succeeds.
export async function POST(request: NextRequest) {
  try {
    // Parse the JSON body supplied by the API client.
    const body = await request.json();

    // Validate one identity, six-digit OTP, and explicit purpose.
    const validated = verifyOtpSchema.parse(body);

    // Capture request metadata for the created session audit fields.
    const context = getAuthRequestContext(request);

    // Verify and consume the OTP before creating a JWT session.
    const result = await verifyOtpService(
      { mobile: validated.mobile, email: validated.email },
      validated.otp,
      validated.purpose,
      context,
    );

    // Preserve the standard successful API response envelope.
    return ApiResponse.success(result);
  } catch (error) {
    // Preserve status codes from expected authentication failures.
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
