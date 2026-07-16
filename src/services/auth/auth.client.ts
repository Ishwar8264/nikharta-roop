import { apiRequest } from "@/src/lib/api-client";
import type {
  AuthTokensData,
  AuthSessionData,
  AuthIdentifierInput,
  AuthPurpose,
  CurrentUser,
  OtpSentData,
  VerifyOtpInput,
} from "@/src/types/auth";
import {
  authOtpSentResponseSchema,
  currentUserResponseSchema,
  logoutResponseSchema,
  refreshAuthResponseSchema,
  verifyOtpResponseSchema,
} from "@/src/validations/auth/auth.validation";

// Reuse one in-flight rotation so concurrent protected requests cannot replay a refresh token.
let refreshSessionPromise: Promise<AuthTokensData> | null = null;

// Rotate the browser session through the cookie-backed refresh endpoint.
const requestSessionRefresh = () =>
  // Send an empty object because the protected browser cookie carries the refresh token.
  apiRequest.post<AuthTokensData, Record<string, never>>(
    "/auth/refresh",
    {},
    refreshAuthResponseSchema,
  );

// Restore the short-lived access session while preventing concurrent token rotation.
export const refreshAuthSession = () => {
  // Start one rotation only when another protected request is not already refreshing.
  if (!refreshSessionPromise) {
    // Share the same promise and release it after either success or failure.
    refreshSessionPromise = requestSessionRefresh().finally(() => {
      // Allow a future refresh attempt after the current rotation settles.
      refreshSessionPromise = null;
    });
  }

  // Return the shared rotation result to every waiting protected request.
  return refreshSessionPromise;
};

// Request an OTP through the purpose-specific endpoint without leaking routing into UI.
export const requestAuthOtp = (
  input: AuthIdentifierInput,
  purpose: AuthPurpose,
) => {
  // Keep login and registration endpoint selection inside the auth service.
  const endpoint = purpose === "LOGIN" ? "/auth/login" : "/auth/register";

  // Reuse the shared client so response validation and errors stay consistent.
  return apiRequest.post<OtpSentData, AuthIdentifierInput>(
    endpoint,
    input,
    authOtpSentResponseSchema,
  );
};

// Verify a login or signup OTP and establish the server-managed browser session.
export const verifyAuthOtp = (input: VerifyOtpInput) =>
  // Reuse the shared client so cookies and validated response data stay aligned.
  apiRequest.post<AuthSessionData, VerifyOtpInput>(
    "/auth/otp/verify",
    input,
    verifyOtpResponseSchema,
  );

// Load the current user and recover one expired access session transparently.
export const getCurrentUser = () =>
  // Retry only this protected request after the cookie-backed rotation succeeds.
  apiRequest.get<CurrentUser>("/auth/me", currentUserResponseSchema, {
    retryOnUnauthorized: refreshAuthSession,
  });

// Revoke the current session after recovering an expired access token when possible.
export const logoutCurrentUser = () =>
  // Keep logout cookie-based and avoid exposing either token to client state.
  apiRequest.post<OtpSentData, Record<string, never>>(
    "/auth/logout",
    {},
    logoutResponseSchema,
    { retryOnUnauthorized: refreshAuthSession },
  );
