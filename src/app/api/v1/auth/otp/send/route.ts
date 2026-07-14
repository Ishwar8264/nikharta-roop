/**
 * @swagger
 * /api/v1/auth/otp/send:
 *   post:
 *     summary: Send OTP for Login or Signup
 *     description: Sends a 6-digit OTP to the user's mobile number. Purpose can be 'LOGIN' or 'SIGNUP'.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - purpose
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               purpose:
 *                 type: string
 *                 enum: [LOGIN, SIGNUP]
 *                 example: "LOGIN"
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid mobile number
 *       409:
 *         description: User already registered (if SIGNUP) or User not found (if LOGIN)
 */

import { NextRequest } from "next/server";
import { ApiResponse } from "@/src/lib/response";
import { sendOtpService } from "@/src/services/auth/auth.service";
import { sendOtpSchema } from "@/src/validations/auth/auth.validation";
// Import custom error class to check for statusCode safely
import { AppError } from "@/src/lib/errors";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = sendOtpSchema.parse(body);
    const result = await sendOtpService(validated.mobile, validated.purpose);
    return ApiResponse.success(result);
  } catch (error) {
    // TypeScript automatically infers 'error' as 'unknown' (safer than 'any').

    // 1. Check if it's our custom AppError (which has a .statusCode property)
    if (error instanceof AppError) {
      return ApiResponse.error(error.message, error.statusCode);
    }

    // 2. Check if it's a standard JavaScript Error
    if (error instanceof Error) {
      return ApiResponse.error(error.message, 400);
    }

    // 3. Fallback for anything else (strings, numbers, etc.)
    return ApiResponse.error("An unexpected error occurred", 500);
  }
}
