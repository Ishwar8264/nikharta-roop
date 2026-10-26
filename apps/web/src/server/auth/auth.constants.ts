import "server-only";

export const ACCESS_COOKIE_NAME = "accessToken";
export const REFRESH_COOKIE_NAME = "refreshToken";
export const CSRF_COOKIE_NAME = "csrfToken";
export const CSRF_HEADER_NAME = "x-csrf-token";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_COOKIE_PATH = "/api/v1/auth";

/** Retry window for recovering the exact live successor of a rotated token. */
export const REFRESH_GRACE_SECONDS = 10;

/** Failed login attempts before per-account lockout. */
export const LOGIN_LOCKOUT_THRESHOLD = 5;
/** Lockout duration after threshold is hit (ms). */
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
