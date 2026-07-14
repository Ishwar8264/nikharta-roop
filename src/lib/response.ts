/**
 * ========================================================
 * API RESPONSE WRAPPER
 * Provides a standardized JSON format for all API responses.
 * Helps frontend handle success and error states uniformly.
 * ========================================================
 */

import { NextResponse } from "next/server";

export class ApiResponse {
  /**
   * Send a successful response.
   * @param data - The payload to send to the client.
   * @param status - HTTP status code (default: 200).
   */
  // TypeScript will auto-infer the type.
  static success<T>(data: T, status: number = 200) {
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
  static error(message: string, status: number = 400) {
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status },
    );
  }
}
