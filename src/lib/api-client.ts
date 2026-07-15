import type { z } from "zod";

import { API_V1_BASE_PATH } from "@/src/constants/api";
import type { ApiResponse } from "@/src/types/api";

// Attach the HTTP status so UI code can distinguish expected API failures.
export class ApiClientError extends Error {
  // Store the response status for optional status-specific UI behavior.
  public readonly statusCode: number;

  // Create one predictable error object for API, network, and parsing failures.
  constructor(message: string, statusCode: number) {
    // Preserve the most useful user-facing message on the native Error object.
    super(message);

    // Keep the status available without exposing the complete Response object.
    this.statusCode = statusCode;

    // Make runtime error checks and development logs easier to understand.
    this.name = "ApiClientError";
  }
}

// Require service paths to begin with a slash for predictable URL composition.
type ApiPath = `/${string}`;

// Keep supported JSON request methods explicit and reusable.
type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Reuse the global response envelope while allowing endpoint-specific data.
type ApiResponseSchema<TData> = z.ZodType<ApiResponse<TData>>;

// Prevent callers from overriding the method or manually serializing JSON bodies.
type ApiRequestOptions = Omit<RequestInit, "body" | "method">;

// Send one versioned JSON request used internally by every HTTP convenience method.
async function request<TData, TBody = never>(
  path: ApiPath,
  method: ApiMethod,
  responseSchema: ApiResponseSchema<TData>,
  body?: TBody,
  options: ApiRequestOptions = {},
): Promise<TData> {
  // Convert every supported header input into one safely mutable Headers instance.
  const requestHeaders = new Headers(options.headers);

  // Add JSON content type only when the request actually contains a body.
  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }

  // Join one global API version prefix with the endpoint-specific relative path.
  const url = `${API_V1_BASE_PATH}${path}`;

  // Hold the response outside try so network errors receive a focused message.
  let response: Response;

  try {
    // Send the request with consistent JSON headers and an optional serialized body.
    response = await fetch(url, {
      ...options,
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (error) {
    // Preserve deliberate request cancellation so UI code can ignore it safely.
    if (error instanceof Error && error.name === "AbortError") {
      throw error;
    }

    // Hide browser-specific network details behind one actionable message.
    throw new ApiClientError("Unable to connect. Please try again.", 0);
  }

  // Treat every response body as unknown until Zod validates its contract.
  let responseBody: unknown;

  try {
    // Parse the standardized JSON envelope returned by the application API.
    responseBody = await response.json();
  } catch {
    // Reject HTML, empty, or malformed responses before UI code can consume them.
    throw new ApiClientError(
      "The server returned an invalid response.",
      response.status,
    );
  }

  // Validate both the global envelope and the endpoint-specific data payload.
  const parsedResponse = responseSchema.safeParse(responseBody);

  // Stop unexpected backend contracts from silently reaching the interface.
  if (!parsedResponse.success) {
    throw new ApiClientError(
      "The server returned an invalid response.",
      response.status,
    );
  }

  // Preserve the backend-provided message for expected application failures.
  if (!parsedResponse.data.success) {
    throw new ApiClientError(parsedResponse.data.error, response.status);
  }

  // Guard inconsistent status codes even when a response claims success.
  if (!response.ok) {
    throw new ApiClientError(
      "The request could not be completed.",
      response.status,
    );
  }

  // Return only validated endpoint data so components avoid envelope parsing.
  return parsedResponse.data.data;
}

// Expose focused helpers so services never repeat HTTP methods or the API prefix.
export const apiRequest = {
  // Read validated data without sending a request body.
  get: <TData>(
    path: ApiPath,
    responseSchema: ApiResponseSchema<TData>,
    options?: ApiRequestOptions,
  ) => request<TData>(path, "GET", responseSchema, undefined, options),

  // Create a resource with one strongly typed JSON payload.
  post: <TData, TBody>(
    path: ApiPath,
    body: TBody,
    responseSchema: ApiResponseSchema<TData>,
    options?: ApiRequestOptions,
  ) => request<TData, TBody>(path, "POST", responseSchema, body, options),

  // Replace a resource with one strongly typed JSON payload.
  put: <TData, TBody>(
    path: ApiPath,
    body: TBody,
    responseSchema: ApiResponseSchema<TData>,
    options?: ApiRequestOptions,
  ) => request<TData, TBody>(path, "PUT", responseSchema, body, options),

  // Partially update a resource with one strongly typed JSON payload.
  patch: <TData, TBody>(
    path: ApiPath,
    body: TBody,
    responseSchema: ApiResponseSchema<TData>,
    options?: ApiRequestOptions,
  ) => request<TData, TBody>(path, "PATCH", responseSchema, body, options),

  // Delete a resource while still validating the standard response envelope.
  delete: <TData>(
    path: ApiPath,
    responseSchema: ApiResponseSchema<TData>,
    options?: ApiRequestOptions,
  ) => request<TData>(path, "DELETE", responseSchema, undefined, options),
};
