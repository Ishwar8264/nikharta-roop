export const AUTH_CODES = {
  ACCOUNT_ALREADY_EXISTS: "ACCOUNT_ALREADY_EXISTS",
  OTP_RETRY_LATER: "AUTH_OTP_RETRY_LATER",
  SIGNUP_OTP_FAILED: "AUTH_SIGNUP_OTP_FAILED",
  SIGNUP_OTP_SENT: "AUTH_SIGNUP_OTP_SENT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
} as const;

export const AUTH_MESSAGES = {
  ACCOUNT_ALREADY_EXISTS:
    "An account already exists with this mobile number. Please log in.",
  INVALID_EMAIL: "Please enter a valid email address.",
  INVALID_MOBILE: "Please enter a valid 10-digit Indian mobile number.",
  INVALID_REQUEST_BODY: "Request body is invalid.",
  OTP_RETRY_LATER: "Please wait before requesting another OTP.",
  SIGNUP_OTP_FAILED: "Could not send OTP. Please try again later.",
  SIGNUP_OTP_SENT:
    "OTP has been sent. Your account will be created after OTP verification.",
} as const;

export const AUTH_OTP_CONFIG = {
  EXPIRES_IN_MINUTES: 5,
  PURPOSE_SIGNUP: "SIGNUP",
  RETRY_AFTER_SECONDS: 30,
  USER_AGENT_MAX_LENGTH: 1000,
} as const;

export const AUTH_SOURCES = {
  REGISTER_ENDPOINT: "register_endpoint",
} as const;
