/**
 * ========================================================
 * API RESPONSE WRAPPER
 * Provides a standardized JSON format for all API responses.
 * Helps frontend handle success and error states uniformly.
 * ========================================================
 */

import { NextResponse } from "next/server";

import type {
  ApiErrorResponse,
  ApiSuccessResponse,
} from "@/src/types/api";

export class ApiResponse {
  /**
   * Send a successful response.
   * @param data - The payload to send to the client.
   * @param status - HTTP status code (default: 200).
   */
  // Return the shared success type so server and client contracts stay aligned.
  static success<T>(
    data: T,
    status: number = 200,
  ): NextResponse<ApiSuccessResponse<T>> {
    return NextResponse.json(
      {
        success: true,
        data: data,
      },
      { status },
    );
  }

  /**
   * Send an error response.
   * @param message - The error message.
   * @param status - HTTP status code (default: 400).
   */
  static error(
    message: string,
    status: number = 400,
  ): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
