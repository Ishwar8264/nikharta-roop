export const AUTH_CODES = {
  ACCOUNT_ALREADY_EXISTS: "ACCOUNT_ALREADY_EXISTS",
  OTP_EXPIRED: "AUTH_OTP_EXPIRED",
  OTP_INVALID: "AUTH_OTP_INVALID",
  OTP_LOCKED: "AUTH_OTP_LOCKED",
  OTP_NOT_FOUND: "AUTH_OTP_NOT_FOUND",
  OTP_RETRY_LATER: "AUTH_OTP_RETRY_LATER",
  SIGNUP_COMPLETED: "AUTH_SIGNUP_COMPLETED",
  SIGNUP_OTP_FAILED: "AUTH_SIGNUP_OTP_FAILED",
  SIGNUP_OTP_SENT: "AUTH_SIGNUP_OTP_SENT",
  SIGNUP_VERIFY_FAILED: "AUTH_SIGNUP_VERIFY_FAILED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export const AUTH_MESSAGES = {
  ACCOUNT_ALREADY_EXISTS:
    "An account already exists with this mobile number. Please log in.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_MOBILE: "Please enter a valid 10-digit Indian mobile number.",
  INVALID_OTP: "Please enter a valid 6-digit OTP.",
  INVALID_REQUEST_BODY: "Request body is invalid.",
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
} as const;

export const AUTH_OTP_CONFIG = {
  EXPIRES_IN_MINUTES: 5,
  LOCKED_FOR_MINUTES: 15,
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
} as const;
