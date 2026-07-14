/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user via OTP
 *     description: Sends a 6-digit OTP to the user's mobile number for login.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid mobile number or user not found
 */

/**
 * ========================================================
 * LOGIN API ROUTE
 * Initiates the login flow by sending an OTP to the user's mobile.
 * Purpose is hardcoded to "LOGIN".
 * ========================================================
 */

import { NextRequest } from "next/server";
import { AppError } from "@/src/lib/errors";
import { ApiResponse } from "@/src/lib/response";
import { sendOtpService } from "@/src/services/auth/auth.service";
import { sendOtpSchema } from "@/src/validations/auth/auth.validation";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate only the mobile number. Purpose is fixed to LOGIN.
    const validated = sendOtpSchema.pick({ mobile: true }).parse(body);

    // Call service with hardcoded "LOGIN" purpose
    const result = await sendOtpService(validated.mobile, "LOGIN");

    return ApiResponse.success(result);
  } catch (error) {
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode);
    }
    if (error instanceof Error) {
      return ApiResponse.error(error.message, 400);
    }
    return ApiResponse.error("An unexpected error occurred", 500);
  }
}
