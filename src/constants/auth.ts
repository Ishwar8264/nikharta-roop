// Keep an OTP valid for exactly one minute as required by the auth policy.
export const OTP_EXPIRY_SECONDS = 60;

// Prevent a new OTP request until the previous one-minute window finishes.
export const OTP_RESEND_COOLDOWN_SECONDS = 60;

// Stop brute-force verification after five incorrect OTP attempts.
export const OTP_MAX_ATTEMPTS = 5;

// Count OTP requests from the same IP within this rolling window.
export const OTP_IP_RATE_LIMIT_WINDOW_MINUTES = 10;

// Limit one IP to ten OTP requests during the rolling window.
export const OTP_IP_RATE_LIMIT_MAX_REQUESTS = 10;

// Keep access tokens short-lived so revoked sessions have limited fallback exposure.
export const ACCESS_TOKEN_EXPIRY = "15m";

// Keep refresh tokens and their database sessions valid for seven days.
export const REFRESH_TOKEN_EXPIRY = "7d";

// Convert the refresh-token lifetime into milliseconds for session persistence.
export const AUTH_SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;
