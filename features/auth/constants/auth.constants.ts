export const AUTH_CODES = {
  ACCOUNT_ALREADY_EXISTS: "ACCOUNT_ALREADY_EXISTS",
  ACCOUNT_INACTIVE: "ACCOUNT_INACTIVE",
  ACCOUNT_NOT_FOUND: "ACCOUNT_NOT_FOUND",
  AUTH_REQUIRED: "AUTH_REQUIRED",
  LOGIN_COMPLETED: "AUTH_LOGIN_COMPLETED",
  LOGIN_OTP_FAILED: "AUTH_LOGIN_OTP_FAILED",
  LOGIN_OTP_SENT: "AUTH_LOGIN_OTP_SENT",
  LOGIN_VERIFY_FAILED: "AUTH_LOGIN_VERIFY_FAILED",
  LOGOUT_COMPLETED: "AUTH_LOGOUT_COMPLETED",
  ME_LOADED: "AUTH_ME_LOADED",
  OTP_EXPIRED: "AUTH_OTP_EXPIRED",
  OTP_INVALID: "AUTH_OTP_INVALID",
  OTP_LOCKED: "AUTH_OTP_LOCKED",
  OTP_NOT_FOUND: "AUTH_OTP_NOT_FOUND",
  OTP_RETRY_LATER: "AUTH_OTP_RETRY_LATER",
  SIGNUP_COMPLETED: "AUTH_SIGNUP_COMPLETED",
  SIGNUP_OTP_FAILED: "AUTH_SIGNUP_OTP_FAILED",
  SIGNUP_OTP_SENT: "AUTH_SIGNUP_OTP_SENT",
  SIGNUP_VERIFY_FAILED: "AUTH_SIGNUP_VERIFY_FAILED",
  SESSION_NOT_FOUND: "AUTH_SESSION_NOT_FOUND",
  SESSION_REFRESHED: "AUTH_SESSION_REFRESHED",
  SESSION_REVOKED: "AUTH_SESSION_REVOKED",
  SESSIONS_LOADED: "AUTH_SESSIONS_LOADED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export const AUTH_MESSAGES = {
  ACCOUNT_ALREADY_EXISTS:
    "An account already exists with this mobile number. Please log in.",
  ACCOUNT_INACTIVE: "This account is inactive. Please contact support.",
  ACCOUNT_NOT_FOUND: "No account found with this mobile number. Please sign up.",
  AUTH_REQUIRED: "Authentication is required.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_MOBILE: "Please enter a valid 10-digit Indian mobile number.",
  INVALID_OTP: "Please enter a valid 6-digit OTP.",
  INVALID_REFRESH_TOKEN: "Refresh token is invalid or expired.",
  INVALID_REQUEST_BODY: "Request body is invalid.",
  LOGIN_COMPLETED: "Login completed successfully.",
  LOGIN_OTP_FAILED: "Could not send login OTP. Please try again later.",
  LOGIN_OTP_SENT: "OTP has been sent. Please verify it to log in.",
  LOGIN_VERIFY_FAILED: "Could not verify login OTP. Please try again later.",
  LOGOUT_COMPLETED: "Logged out successfully.",
  ME_LOADED: "Authenticated user loaded successfully.",
  OTP_EXPIRED: "OTP has expired. Please request a new OTP.",
  OTP_INVALID: "Invalid OTP. Please try again.",
  OTP_LOCKED: "Too many invalid attempts. Please request a new OTP later.",
  OTP_NOT_FOUND: "No active signup OTP found. Please request a new OTP.",
  OTP_RETRY_LATER: "Please wait before requesting another OTP.",
  SIGNUP_COMPLETED: "Account created successfully.",
  SIGNUP_OTP_FAILED: "Could not send OTP. Please try again later.",
  SIGNUP_OTP_SENT:
    "OTP has been sent. Your account will be created after OTP verification.",
  SIGNUP_VERIFY_FAILED: "Could not verify OTP. Please try again later.",
  SESSION_NOT_FOUND: "Session not found.",
  SESSION_REFRESHED: "Session refreshed successfully.",
  SESSION_REVOKED: "Session revoked successfully.",
  SESSIONS_LOADED: "Active sessions loaded successfully.",
} as const;

export const AUTH_OTP_CONFIG = {
  EXPIRES_IN_MINUTES: 5,
  LOCKED_FOR_MINUTES: 15,
  PURPOSE_LOGIN: "LOGIN",
  PURPOSE_SIGNUP: "SIGNUP",
  RETRY_AFTER_SECONDS: 30,
  USER_AGENT_MAX_LENGTH: 1000,
} as const;

export const AUTH_SESSION_CONFIG = {
  EXPIRES_IN_DAYS: 30,
} as const;

export const AUTH_SOURCES = {
  REGISTER_ENDPOINT: "register_endpoint",
  REGISTER_VERIFY_ENDPOINT: "register_verify_endpoint",
  LOGIN_ENDPOINT: "login_endpoint",
  LOGIN_VERIFY_ENDPOINT: "login_verify_endpoint",
  LOGOUT_ENDPOINT: "logout_endpoint",
  REFRESH_ENDPOINT: "refresh_endpoint",
  REVOKE_SESSION_ENDPOINT: "revoke_session_endpoint",
} as const;
