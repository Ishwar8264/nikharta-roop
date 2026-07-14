/**
 * @swagger
 * /api/v1/auth/otp/verify:
 *   post:
 *     summary: Verify OTP and get Access/Refresh tokens
 *     description: Completes the login or signup flow by verifying the 6-digit OTP.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - otp
 *               - purpose
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               purpose:
 *                 type: string
 *                 enum: [LOGIN, SIGNUP]
 *                 example: "LOGIN"
 *     responses:
 *       200:
 *         description: Successful login/signup, returns tokens
 *       400:
 *         description: Invalid or expired OTP
 */

import { NextRequest } from "next/server";
import { ApiResponse } from "@/src/lib/response";
import { verifyOtpService } from "@/src/services/auth/auth.service";
import { verifyOtpSchema } from "@/src/validations/auth/auth.validation";
import { AppError } from "@/src/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = verifyOtpSchema.parse(body);
    const result = await verifyOtpService(
      validated.mobile,
      validated.otp,
      validated.purpose,
    );
    return ApiResponse.success(result);
  } catch (error) {
    // TypeScript infers 'error' as 'unknown'. We safely narrow the type below.

    // 1. If it's our custom AppError, use its statusCode
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode);
    }

    // 2. If it's a standard JS Error (like ZodError or SyntaxError)
    if (error instanceof Error) {
      return ApiResponse.error(error.message, 400);
    }

    // 3. Fallback for any other unknown error types
    return ApiResponse.error("An unexpected error occurred", 500);
  }
}
