import "server-only";

import type { OpenAPIV3_1 } from "openapi-types";

import { adminPaths, adminSchemas } from "./admin.openapi";
import { aiPaths, aiSchemas } from "./ai.openapi";
import { appointmentPaths, appointmentSchemas } from "./appointment.openapi";
import { auditPaths, auditSchemas } from "./audit.openapi";
import { blogPaths, blogSchemas } from "./blog.openapi";
import { couponPaths, couponSchemas } from "./coupon.openapi";
import { favoritePaths, favoriteSchemas } from "./favorite.openapi";
import { loyaltyPaths, loyaltySchemas } from "./loyalty.openapi";
import { mediaPaths, mediaSchemas } from "./media.openapi";
import { notificationPaths, notificationSchemas } from "./notification.openapi";
import { oauthPaths, oauthSchemas } from "./oauth.openapi";
import { reviewPaths, reviewSchemas } from "./review.openapi";
const errorResponseSchema: OpenAPIV3_1.SchemaObject = {
  type: "object",
  required: ["message"],
  properties: {
    message: { type: "string" },
  },
};

/**
 * Builds the public OpenAPI contract consumed by Swagger UI and API clients.
 *
 * Why:
 * Keeping the contract in one server-only module prevents the interactive UI
 * and the machine-readable `/api-docs` response from drifting apart.
 */
export function getOpenApiDocument(): OpenAPIV3_1.Document {
  return {
    openapi: "3.1.0",
    info: {
      title: "Nikharta Roop API",
      version: "1.0.0",
      description:
        "Interactive API documentation for the Nikharta Roop platform.",
    },
    servers: [
      {
        url: "/",
        description: "Current server",
      },
    ],
    tags: [
      { name: "Authentication", description: "User identity operations" },
      { name: "System", description: "Service availability operations" },
      { name: "Salons", description: "Salon directory and management" },
      { name: "Services", description: "Salon service catalogue" },
      { name: "Products", description: "Salon product catalogue" },
      {
        name: "Staff",
        description: "Salon staff, schedules, leaves, and skills",
      },
      {
        name: "Salon Working Hours",
        description: "Weekly opening hours for a salon",
      },
      {
        name: "Appointments",
        description: "Booking, availability, lifecycle, and payment operations",
      },
      {
        name: "Reviews & Ratings",
        description: "Service, product, and staff feedback",
      },
      {
        name: "Favorites",
        description: "Saved salons, services, and products",
      },
      {
        name: "Loyalty",
        description: "Points ledger, balance, and redemption",
      },
      {
        name: "Notifications",
        description: "User inbox and delivery attempts",
      },
      {
        name: "Media",
        description: "Private media library and Cloudinary asset metadata",
      },
      {
        name: "Blog",
        description: "Blog posts, comments, categories, and tags",
      },
      { name: "Audit", description: "Platform audit trail (SUPER_ADMIN only)" },
      { name: "AI", description: "Chat with the AI assistant" },
      {
        name: "Admin",
        description: "Platform administration (SUPER_ADMIN only)",
      },
      { name: "Coupons", description: "Discount coupons and validation" },
      {
        name: "OAuth",
        description: "Social sign-in via Google, Apple, and Facebook",
      },
    ],
    paths: {
      // ============================================================
      // AUTHENTICATION
      // ============================================================
      "/api/v1/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a user",
          description:
            "Creates an email-authenticated local account. Phone may be stored " +
            "as profile data, but phone authentication is not available yet.",
          operationId: "registerUser",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/RegisterUserRequest",
                },
                examples: {
                  emailRegistration: {
                    summary: "Register with email",
                    value: {
                      name: "Ishwar Kumar",
                      email: "ishwar@example.com",
                      password: "secure-password",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "User registered successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/RegisterUserResponse",
                  },
                },
              },
            },
            "400": {
              description: "Malformed JSON or validation failure",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "409": {
              description: "Email or phone already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected registration failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Sign in a user",
          description:
            "Authenticates a user with a verified email and password. " +
            "Returns the access token in the response body and sets " +
            "httpOnly session cookies plus a readable `csrfToken` cookie. " +
            "Use the returned token with the `bearerAuth` scheme for " +
            "protected endpoints.",
          operationId: "loginUser",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/LoginUserRequest",
                },
                examples: {
                  emailLogin: {
                    summary: "Sign in with email",
                    value: {
                      email: "ishwar@example.com",
                      password: "secure-password",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Login successful. Sets `accessToken` and `refreshToken` " +
                "httpOnly cookies and returns the access token in the body.",
              headers: {
                "Set-Cookie": {
                  description:
                    "httpOnly access/refresh cookies and a readable CSRF cookie.",
                  schema: { type: "string" },
                },
              },
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/LoginUserResponse",
                  },
                },
              },
            },
            "400": {
              description: "Malformed JSON or validation failure",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "401": {
              description: "Invalid email or password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description:
                "Account exists but email is not verified, or account is deactivated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected sign-in failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/refresh": {
        post: {
          tags: ["Authentication"],
          summary: "Rotate refresh token",
          description:
            "Exchanges the `refreshToken` httpOnly cookie for a new access + " +
            "refresh token pair. The previous refresh token is revoked on every " +
            "successful call. Reuse of a revoked token revokes every session for " +
            "that user, forcing a full re-login. Send the readable `csrfToken` " +
            "cookie value in the `x-csrf-token` header.",
          operationId: "refreshTokens",
          security: [{ csrfToken: [] }],
          responses: {
            "200": {
              description:
                "Token refreshed. Sets new `accessToken` and `refreshToken` " +
                "httpOnly cookies.",
              headers: {
                "Set-Cookie": {
                  description:
                    "New auth cookies and rotated readable CSRF cookie.",
                  schema: { type: "string" },
                },
              },
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/RefreshTokenResponse",
                  },
                },
              },
            },
            "401": {
              description:
                "Missing, invalid, expired, or already-revoked refresh token. " +
                "All session cookies are cleared.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description: "Missing or invalid CSRF token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected refresh failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/logout": {
        post: {
          tags: ["Authentication"],
          summary: "Log out the current session",
          description:
            "Revokes the `refreshToken` httpOnly cookie on the server and clears " +
            "all session cookies. Send the `csrfToken` cookie value in the " +
            "`x-csrf-token` header. Idempotent: returns 200 when no " +
            "session exists. Access tokens are short-lived JWTs and are not " +
            "revoked explicitly — they expire on their own.",
          operationId: "logoutUser",
          security: [{ csrfToken: [] }],
          responses: {
            "200": {
              description:
                "Logged out. Access, refresh, and CSRF cookies are cleared.",
              headers: {
                "Set-Cookie": {
                  description:
                    "Access, refresh, and CSRF cookies cleared (maxAge: 0).",
                  schema: { type: "string" },
                },
              },
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/LogoutResponse",
                  },
                },
              },
            },
            "500": {
              description: "Unexpected logout failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description: "Missing or invalid CSRF token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/me": {
        get: {
          tags: ["Authentication"],
          summary: "Get the current user",
          description:
            "Returns the profile of the authenticated user. Accepts either an " +
            "`Authorization: Bearer <accessToken>` header or the `accessToken` " +
            "httpOnly cookie. The user is re-read from the database on every call, " +
            "so role changes and soft-deletes take effect immediately.",
          operationId: "getCurrentUser",
          security: [{ bearerAuth: [] }, { accessCookie: [] }],
          responses: {
            "200": {
              description: "Authenticated user profile",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/CurrentUserResponse",
                  },
                },
              },
            },
            "401": {
              description:
                "Missing, invalid, or expired access token, or the account no longer exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected failure while loading the user",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        patch: {
          tags: ["Authentication"],
          summary: "Update the current user's profile",
          description:
            "Applies a partial update to the authenticated user's profile. " +
            "Only the fields present in the body are written — omitted fields are " +
            "left untouched. Empty bodies are rejected with 400 so a client cannot " +
            "mistake a no-op for success. Email, phone, role, and verification " +
            "flags are intentionally not editable through this endpoint.",
          operationId: "updateCurrentUser",
          security: [{ bearerAuth: [] }, { accessCookie: [], csrfToken: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateProfileRequest",
                },
                examples: {
                  nameAndBio: {
                    summary: "Update name and bio",
                    value: {
                      name: "Ishwar Kumar",
                      bio: "Salon enthusiast based in Mumbai.",
                    },
                  },
                  location: {
                    summary: "Update approximate location",
                    value: { lat: 19.076, lng: 72.8777 },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Profile updated",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/UpdatedProfileResponse",
                  },
                },
              },
            },
            "400": {
              description:
                "Malformed JSON, validation failure, or empty body (no fields to update)",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "401": {
              description: "Missing, invalid, or expired access token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected failure while updating the profile",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/otp/send": {
        post: {
          tags: ["Authentication"],
          summary: "Send an email verification code",
          description:
            "Issues a 6-digit OTP to the supplied email. The response " +
            "shape is identical whether the identifier exists or not, which " +
            "prevents this endpoint from being used for account enumeration. " +
            "A 60-second cooldown applies per user + channel — the `Retry-After` " +
            "header on 429 responses tells the client when to retry.",
          operationId: "sendOtp",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/SendOtpRequest",
                },
                examples: {
                  emailOtp: {
                    summary: "Send code to email",
                    value: { email: "ishwar@example.com" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Code dispatched (or silently skipped for already-verified or " +
                "unknown identifiers — the client cannot tell the difference).",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SendOtpResponse",
                  },
                },
              },
            },
            "400": {
              description: "Malformed JSON or validation failure",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "429": {
              description:
                "Resend cooldown active. `Retry-After` header holds the seconds to wait.",
              headers: {
                "Retry-After": {
                  description: "Seconds until a new code can be requested.",
                  schema: { type: "integer" },
                },
              },
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "502": {
              description: "Email provider rejected the message",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected failure while issuing the code",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/otp/verify": {
        post: {
          tags: ["Authentication"],
          summary: "Verify an OTP code",
          description:
            "Validates a 6-digit code and marks the matching identifier as " +
            "verified. Codes expire after 10 minutes and allow at most 5 wrong " +
            "guesses before being burned. On success, the user can log in " +
            "without hitting the 403 'email not verified' guard.",
          operationId: "verifyOtp",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/VerifyOtpRequest",
                },
                examples: {
                  emailVerify: {
                    summary: "Verify email code",
                    value: { email: "ishwar@example.com", code: "482193" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Code accepted — identifier is now verified",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/VerifyOtpResponse",
                  },
                },
              },
            },
            "400": {
              description:
                "Malformed JSON, validation failure, or incorrect code",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "410": {
              description: "Code has expired — request a new one",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "429": {
              description: "Too many wrong attempts — request a new code",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected failure while verifying the code",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/password/forgot": {
        post: {
          tags: ["Authentication"],
          summary: "Request password reset code",
          description:
            "Sends a 6-digit OTP to the user's email for password reset. " +
            "The response is always a success to prevent email enumeration.",
          operationId: "forgotPassword",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ForgotPasswordRequest",
                },
                examples: {
                  emailReset: {
                    summary: "Reset via email",
                    value: { email: "ishwar@example.com" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Reset code sent successfully (or silently skipped).",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ForgotPasswordResponse",
                  },
                },
              },
            },
            "400": {
              description: "Malformed JSON or validation failure",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "429": {
              description:
                "Resend cooldown active. Wait before requesting again.",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected failure while issuing the code",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/password/reset": {
        post: {
          tags: ["Authentication"],
          summary: "Reset password using OTP",
          description:
            "Validates the 6-digit code sent to the user's email and updates " +
            "their password. The code is burned and all refresh sessions are " +
            "revoked atomically after successful use.",
          operationId: "resetPassword",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ResetPasswordRequest",
                },
                examples: {
                  resetPassword: {
                    summary: "Reset password",
                    value: {
                      email: "ishwar@example.com",
                      code: "482193",
                      newPassword: "new-secure-password",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Password reset successfully",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ResetPasswordResponse",
                  },
                },
              },
            },
            "400": {
              description:
                "Malformed JSON, validation failure, or incorrect code",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "410": {
              description: "Code has expired — request a new one",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "429": {
              description: "Too many wrong attempts — request a new code",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected failure while resetting the password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/password/change": {
        post: {
          tags: ["Authentication"],
          summary: "Change the current user's password",
          description:
            "Replaces the authenticated user's password after re-verifying the " +
            "current one. The current password requirement means a stolen access " +
            "token alone cannot lock the real owner out. On success, every old " +
            "refresh session is revoked and this device receives a newly rotated " +
            "access + refresh token pair.",
          operationId: "changePassword",
          security: [{ bearerAuth: [] }, { accessCookie: [], csrfToken: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ChangePasswordRequest",
                },
                examples: {
                  standardChange: {
                    summary: "Standard password change",
                    value: {
                      currentPassword: "old-secure-password",
                      newPassword: "brand-new-password-999",
                    },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Password updated. Old sessions were revoked and auth cookies rotated.",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ChangePasswordResponse",
                  },
                },
              },
            },
            "400": {
              description:
                "Malformed JSON, validation failure, or new password matches the current one",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "401": {
              description:
                "Missing/invalid access token, or the supplied current password is incorrect",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected failure while changing the password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/account": {
        delete: {
          tags: ["Authentication"],
          summary: "Delete the current user's account",
          description:
            "Soft-deletes the authenticated user's account after confirming the " +
            "current password. The user row remains in the database with " +
            "`deletedAt` set so appointments, reviews, and audit trails keep their " +
            "references. All live refresh tokens are revoked; auth cookies are " +
            "cleared on the response.",
          operationId: "deleteAccount",
          security: [{ bearerAuth: [] }, { accessCookie: [], csrfToken: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/DeleteAccountRequest",
                },
                examples: {
                  confirm: {
                    summary: "Confirm deletion with password",
                    value: { password: "your-current-password" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description:
                "Account deleted. Auth cookies are cleared in the response headers.",
              headers: {
                "Set-Cookie": {
                  description:
                    "Clears accessToken, refreshToken, and csrfToken cookies.",
                  schema: { type: "string" },
                },
              },
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "400": {
              description: "Malformed JSON or validation failure",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "401": {
              description:
                "Missing/invalid access token, or the supplied password is incorrect",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected failure while deleting the account",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/session": {
        get: {
          tags: ["Authentication"],
          summary: "List active sessions",
          description:
            "Returns the authenticated user's non-revoked, non-expired refresh " +
            "sessions. Token hashes are never returned. When the refresh cookie " +
            "matches a listed session, `isCurrent` is true.",
          operationId: "listSessions",
          security: [{ bearerAuth: [] }, { accessCookie: [] }],
          responses: {
            "200": {
              description: "Active sessions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SessionListResponse" },
                },
              },
            },
            "401": {
              description: "Missing, invalid, or expired access token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected failure while loading sessions",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/auth/session/{id}": {
        delete: {
          tags: ["Authentication"],
          summary: "Revoke an active session",
          description:
            "Revokes one active refresh session owned by the authenticated user. " +
            "Revoking the current cookie-backed session also clears auth cookies.",
          operationId: "revokeSession",
          security: [{ bearerAuth: [] }, { accessCookie: [], csrfToken: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              description: "Refresh session ID",
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Session revoked",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "400": {
              description: "Session ID format is invalid",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "401": {
              description: "Missing, invalid, or expired access token",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "No active user-owned session has this ID",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected failure while revoking the session",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      // ============================================================
      // SALONS
      // ============================================================
      "/api/v1/salons": {
        get: {
          tags: ["Salons"],
          summary: "List salons",
          description:
            "Cursor-paginated list of active salons. Supports `city`, `category`, " +
            "and `search` filters. Cursor pagination is stable under inserts, so " +
            "infinite scroll will not skip entries when new salons appear.",
          operationId: "listSalons",
          security: [],
          parameters: [
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
            {
              name: "city",
              in: "query",
              schema: { type: "string", maxLength: 80 },
              example: "Mumbai",
            },
            {
              name: "category",
              in: "query",
              schema: {
                type: "string",
                enum: ["MALE", "FEMALE", "UNISEX", "KIDS"],
              },
            },
            {
              name: "search",
              in: "query",
              schema: { type: "string", minLength: 2, maxLength: 80 },
              description: "Case-insensitive match on name or description.",
            },
          ],
          responses: {
            "200": {
              description: "Paginated list of salons",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedSalonsResponse",
                  },
                },
              },
            },
            "400": {
              description: "Validation failure",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "500": {
              description: "Unexpected listing failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Salons"],
          summary: "Create a salon",
          description:
            "Any authenticated user can open a salon and becomes its first OWNER. " +
            "If `slug` is omitted it is derived from `name` with numeric suffixes " +
            "on collision.",
          operationId: "createSalon",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateSalonRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Salon created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SalonResponse" },
                },
              },
            },
            "400": {
              description: "Malformed JSON or validation failure",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Slug already in use",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected creation failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}": {
        get: {
          tags: ["Salons"],
          summary: "Get a salon by slug",
          description: "Public detail lookup by the salon's URL slug.",
          operationId: "getSalonBySlug",
          security: [],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string", minLength: 2, maxLength: 80 },
            },
          ],
          responses: {
            "200": {
              description: "Salon detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SalonResponse" },
                },
              },
            },
            "400": {
              description: "Invalid slug",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "404": {
              description: "Salon not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected lookup failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        patch: {
          tags: ["Salons"],
          summary: "Update a salon",
          description:
            "Partial update. Requires at least MANAGER on the target salon. Empty " +
            "bodies are rejected with 400.",
          operationId: "updateSalon",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateSalonRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Salon updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SalonResponse" },
                },
              },
            },
            "400": {
              description: "Malformed JSON, validation failure, or empty body",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon not found or caller is not a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Slug already in use",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected update failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Salons"],
          summary: "Delete a salon",
          description:
            "Soft-deletes a salon. Requires OWNER on the target salon. The row " +
            "remains in the database with `deletedAt` set so downstream data keeps " +
            "its references.",
          operationId: "deleteSalon",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Salon deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon not found or caller is not a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected deletion failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{id}/members": {
        get: {
          tags: ["Salons"],
          summary: "List salon members",
          description: "Requires at least MANAGER on the target salon.",
          operationId: "listSalonMembers",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Member roster",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/SalonMemberListResponse",
                  },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon not found or caller is not a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected listing failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Salons"],
          summary: "Add a salon member",
          description: "Requires OWNER on the target salon.",
          operationId: "addSalonMember",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AddSalonMemberRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Member added",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SalonMemberResponse" },
                },
              },
            },
            "400": {
              description: "Validation failure",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon not found or caller is not a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "User is already a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected add failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{id}/members/{memberId}": {
        delete: {
          tags: ["Salons"],
          summary: "Remove a salon member",
          description:
            "Requires OWNER on the target salon. The last OWNER cannot be removed " +
            "— the request returns 409 to prevent orphaning the salon.",
          operationId: "removeSalonMember",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
            {
              name: "memberId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Member removed",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon or member not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Cannot remove the last owner",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "500": {
              description: "Unexpected removal failure",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/services/categories": {
        get: {
          tags: ["Services"],
          summary: "List global service categories",
          operationId: "listServiceCategories",
          security: [],
          parameters: [
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
          ],
          responses: {
            "200": {
              description: "Paginated list of categories",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedCategoriesResponse",
                  },
                },
              },
            },
            "400": {
              description: "Validation failure",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Services"],
          summary: "Create a global service category",
          description: "Requires SUPER_ADMIN.",
          operationId: "createServiceCategory",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateCategoryRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Category created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CategoryResponse" },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description: "Requires SUPER_ADMIN role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Category slug already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/services": {
        get: {
          tags: ["Services"],
          summary: "List services for a salon",
          operationId: "listSalonServices",
          security: [],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "minPrice", in: "query", schema: { type: "number" } },
            { name: "maxPrice", in: "query", schema: { type: "number" } },
            {
              name: "sortBy",
              in: "query",
              schema: {
                type: "string",
                enum: ["createdAt", "price", "duration", "name"],
                default: "createdAt",
              },
            },
            {
              name: "sortOrder",
              in: "query",
              schema: {
                type: "string",
                enum: ["asc", "desc"],
                default: "desc",
              },
            },
          ],
          responses: {
            "200": {
              description: "Paginated list of services",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedServicesResponse",
                  },
                },
              },
            },
            "404": {
              description: "Salon not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Services"],
          summary: "Create a service in a salon",
          description: "Requires at least MANAGER on the target salon.",
          operationId: "createSalonService",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateServiceRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Service created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ServiceResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon or category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Service slug already exists in this salon",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/services/{serviceId}": {
        get: {
          tags: ["Services"],
          summary: "Get a service by slug",
          operationId: "getSalonService",
          security: [],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Service detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ServiceResponse" },
                },
              },
            },
            "404": {
              description: "Salon or service not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        patch: {
          tags: ["Services"],
          summary: "Update a service",
          description: "Requires at least MANAGER on the parent salon.",
          operationId: "updateSalonService",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateServiceRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Service updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ServiceResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon, service, or category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Service slug already exists in this salon",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Services"],
          summary: "Delete a service",
          description: "Soft-deletes a service. Requires at least MANAGER.",
          operationId: "deleteSalonService",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Service deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon or service not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      // ============================================================
      // SYSTEM
      // ============================================================
      "/api/v1/products/categories": {
        get: {
          tags: ["Products"],
          summary: "List global product categories",
          operationId: "listProductCategories",
          security: [],
          parameters: [
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
          ],
          responses: {
            "200": {
              description: "Paginated product categories",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedProductCategoriesResponse",
                  },
                },
              },
            },
            "400": {
              description: "Validation failure",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ["Products"],
          summary: "Create a global product category",
          description: "Requires SUPER_ADMIN.",
          operationId: "createProductCategory",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateProductCategoryRequest",
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Product category created",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ProductCategoryResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "409": {
              description: "Category slug already exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/products": {
        get: {
          tags: ["Products"],
          summary: "List products for a salon",
          operationId: "listSalonProducts",
          security: [],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
            { name: "category", in: "query", schema: { type: "string" } },
            { name: "search", in: "query", schema: { type: "string" } },
            { name: "minPrice", in: "query", schema: { type: "number" } },
            { name: "maxPrice", in: "query", schema: { type: "number" } },
            { name: "inStock", in: "query", schema: { type: "boolean" } },
            {
              name: "sortBy",
              in: "query",
              schema: {
                type: "string",
                enum: ["createdAt", "price", "name"],
                default: "createdAt",
              },
            },
            {
              name: "sortOrder",
              in: "query",
              schema: {
                type: "string",
                enum: ["asc", "desc"],
                default: "desc",
              },
            },
          ],
          responses: {
            "200": {
              description: "Paginated products",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedProductsResponse",
                  },
                },
              },
            },
            "404": {
              description: "Salon not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Products"],
          summary: "Create a product in a salon",
          description: "Requires at least MANAGER on the target salon.",
          operationId: "createSalonProduct",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateProductRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Product created",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProductResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon or product category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Product slug already exists in this salon",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/products/{productId}": {
        get: {
          tags: ["Products"],
          summary: "Get a product",
          operationId: "getSalonProduct",
          security: [],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "productId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Product detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProductResponse" },
                },
              },
            },
            "404": {
              description: "Salon or product not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        patch: {
          tags: ["Products"],
          summary: "Update a product",
          description: "Requires at least MANAGER on the parent salon.",
          operationId: "updateSalonProduct",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "productId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateProductRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Product updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ProductResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon, product, or category not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Product slug already exists in this salon",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Products"],
          summary: "Delete a product",
          description: "Soft-deletes a product. Requires at least MANAGER.",
          operationId: "deleteSalonProduct",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "productId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Product deleted",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon or product not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/staff": {
        get: {
          tags: ["Staff"],
          summary: "List staff in a salon",
          operationId: "listSalonStaff",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            { $ref: "#/components/parameters/CursorParam" },
            { $ref: "#/components/parameters/LimitParam" },
            {
              name: "role",
              in: "query",
              schema: { type: "string", enum: ["OWNER", "MANAGER", "STAFF"] },
            },
          ],
          responses: {
            "200": {
              description: "Paginated staff list",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedStaffResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "404": {
              description: "Salon not found or caller is not a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/staff/{staffId}": {
        get: {
          tags: ["Staff"],
          summary: "Get a staff member",
          operationId: "getStaffDetail",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Staff detail",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/StaffResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon or staff member not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/staff/{staffId}/schedule": {
        get: {
          tags: ["Staff"],
          summary: "Get a staff member's weekly schedule",
          operationId: "getStaffSchedule",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Weekly schedule",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ScheduleResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon or staff member not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Staff"],
          summary: "Replace a staff member's weekly schedule",
          description:
            "Requires MANAGER or OWNER. Staff cannot edit their own schedule.",
          operationId: "replaceStaffSchedule",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReplaceScheduleRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Schedule replaced",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ScheduleResponse" },
                },
              },
            },
            "400": {
              description: "Validation failure",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/v1/salons/{salonId}/staff/{staffId}/leaves": {
        get: {
          tags: ["Staff"],
          summary: "List leave requests",
          operationId: "listStaffLeaves",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Leave requests",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/PaginatedLeavesResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        post: {
          tags: ["Staff"],
          summary: "Request a leave",
          operationId: "createStaffLeave",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateLeaveRequest" },
              },
            },
          },
          responses: {
            "201": {
              description: "Leave requested",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LeaveResponse" },
                },
              },
            },
            "400": {
              description: "Validation failure",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "409": {
              description: "Overlapping leave exists",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/staff/{staffId}/leaves/{leaveId}": {
        patch: {
          tags: ["Staff"],
          summary: "Approve or reject a leave",
          operationId: "updateStaffLeave",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
            {
              name: "leaveId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateLeaveRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Leave updated",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LeaveResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon, staff member, or leave not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        delete: {
          tags: ["Staff"],
          summary: "Cancel a leave",
          operationId: "cancelStaffLeave",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
            {
              name: "leaveId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Leave cancelled",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SuccessResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
            "404": {
              description: "Salon, staff member, or leave not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "409": {
              description: "Approved leave requires manager cancellation",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonId}/staff/{staffId}/skills": {
        get: {
          tags: ["Staff"],
          summary: "List a staff member's skills",
          operationId: "getStaffSkills",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          responses: {
            "200": {
              description: "Skill list",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SkillsResponse" },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
        put: {
          tags: ["Staff"],
          summary: "Replace a staff member's skills",
          operationId: "replaceStaffSkills",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "staffId",
              in: "path",
              required: true,
              schema: { $ref: "#/components/schemas/ResourceId" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReplaceSkillsRequest" },
              },
            },
          },
          responses: {
            "200": {
              description: "Skills replaced",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/SkillsResponse" },
                },
              },
            },
            "400": {
              description: "Validation failure or service from another salon",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "401": { $ref: "#/components/responses/Unauthorized" },
            "403": { $ref: "#/components/responses/Forbidden" },
          },
        },
      },
      "/api/v1/salons/{salonId}/services/{serviceId}/staff": {
        get: {
          tags: ["Staff"],
          summary: "List staff who can perform a service",
          operationId: "listStaffForSalonService",
          security: [],
          parameters: [
            {
              name: "salonId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
            {
              name: "serviceId",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Staff who can perform the service",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/StaffListResponse" },
                },
              },
            },
            "404": {
              description: "Salon or service not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/salons/{salonRef}/working-hours": {
        get: {
          tags: ["Salon Working Hours"],
          summary: "Get a salon's weekly opening hours",
          operationId: "getSalonWorkingHours",
          security: [],
          parameters: [
            {
              name: "salonRef",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          responses: {
            "200": {
              description: "Weekly hours",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/WorkingHoursResponse",
                  },
                },
              },
            },
            "400": {
              description: "Invalid salon reference",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/ValidationErrorResponse",
                  },
                },
              },
            },
            "404": {
              description: "Salon not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        put: {
          tags: ["Salon Working Hours"],
          summary: "Replace a salon's weekly opening hours",
          description:
            "Requires at least MANAGER on the target salon. Sends the full week " +
            "as one request; each day may appear at most once.",
          operationId: "replaceSalonWorkingHours",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "salonRef",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ReplaceWorkingHoursRequest",
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Working hours replaced",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/WorkingHoursResponse",
                  },
                },
              },
            },
            "400": {
              description: "Invalid salon reference, JSON, or request body",
              content: {
                "application/json": {
                  schema: {
                    oneOf: [
                      { $ref: "#/components/schemas/ErrorResponse" },
                      { $ref: "#/components/schemas/ValidationErrorResponse" },
                    ],
                  },
                },
              },
            },
            "401": {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "403": {
              description: "Insufficient salon role",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            "404": {
              description: "Salon not found or caller is not a member",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },
      ...oauthPaths,
      ...couponPaths,
      ...adminPaths,
      ...aiPaths,
      ...auditPaths,
      ...blogPaths,
      ...notificationPaths,
      ...loyaltyPaths,
      ...appointmentPaths,
      ...reviewPaths,
      ...favoritePaths,
      ...mediaPaths,
      "/api/v1/health": {
        get: {
          tags: ["System"],
          summary: "Check service health",
          description:
            "Checks whether the API and its PostgreSQL dependency are available.",
          operationId: "getHealthStatus",
          responses: {
            "200": {
              description: "API and database are available",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
            "503": {
              description: "Database is unavailable",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/UnhealthyResponse",
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "JWT access token for protected endpoints",
        },
        accessCookie: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description:
            "HttpOnly JWT cookie set by login, refresh, and password change.",
        },
        csrfToken: {
          type: "apiKey",
          in: "header",
          name: "x-csrf-token",
          description:
            "Required for cookie-authenticated mutations. Copy the value from the readable csrfToken cookie. Bearer-only clients are exempt.",
        },
      },

      responses: {
        Unauthorized: {
          description: "Authentication required",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
        Forbidden: {
          description: "Insufficient permission",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ErrorResponse" },
            },
          },
        },
      },

      parameters: {
        CursorParam: {
          name: "cursor",
          in: "query",
          required: false,
          description:
            "Opaque cursor returned by the previous page (`meta.nextCursor`).",
          schema: { $ref: "#/components/schemas/ResourceId" },
        },
        LimitParam: {
          name: "limit",
          in: "query",
          required: false,
          description: "Page size. Defaults to 20, max 50.",
          schema: {
            type: "integer",
            minimum: 1,
            maximum: 50,
            default: 20,
          },
        },
      },

      schemas: {
        ResourceId: {
          description:
            "A 48-character secure ID. UUID is also accepted for records created before the ID migration.",
          oneOf: [
            {
              type: "string",
              pattern: "^[a-f0-9]{48}$",
              example: "3fe48374dc93727a7c57bd53796fe078dc46b76b6f21fffb",
            },
            { type: "string", format: "uuid" },
          ],
        },
        RegisterUserRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name", "email", "password"],
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "Ishwar Kumar",
            },
            email: {
              type: "string",
              format: "email",
              maxLength: 254,
              example: "ishwar@example.com",
            },
            phone: {
              type: "string",
              pattern: "^\\+[1-9]\\d{7,14}$",
              example: "+919876543210",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 8,
              maxLength: 128,
              writeOnly: true,
              example: "secure-password",
            },
          },
        },
        LoginUserRequest: {
          type: "object",
          additionalProperties: false,
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              maxLength: 254,
              example: "ishwar@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 1,
              maxLength: 128,
              writeOnly: true,
              example: "secure-password",
            },
          },
        },
        RefreshTokenResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "Token refreshed",
            },
            data: {
              type: "object",
              required: ["accessToken", "accessTokenExpiresIn"],
              properties: {
                accessToken: {
                  type: "string",
                  description:
                    "New short-lived JWT. Also set as an httpOnly cookie.",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi...",
                },
                accessTokenExpiresIn: {
                  type: "integer",
                  description: "Access token lifetime in seconds.",
                  example: 900,
                },
              },
            },
          },
        },
        SendOtpRequest: {
          type: "object",
          additionalProperties: false,
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              maxLength: 254,
              example: "ishwar@example.com",
            },
          },
        },
        SendOtpResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "Verification code sent",
            },
            data: {
              type: "object",
              required: ["channel", "expiresAt", "resendAvailableInSeconds"],
              properties: {
                channel: {
                  type: "string",
                  enum: ["EMAIL"],
                  example: "EMAIL",
                },
                expiresAt: {
                  type: "string",
                  format: "date-time",
                  description:
                    "Instant the code stops being valid (10 minutes ahead).",
                },
                resendAvailableInSeconds: {
                  type: "integer",
                  description: "Cooldown before a new code may be requested.",
                  example: 60,
                },
              },
            },
          },
        },
        VerifyOtpRequest: {
          type: "object",
          additionalProperties: false,
          required: ["email", "code"],
          properties: {
            email: {
              type: "string",
              format: "email",
              maxLength: 254,
              example: "ishwar@example.com",
            },
            code: {
              type: "string",
              pattern: "^\\d{6}$",
              description: "6-digit numeric code",
              example: "482193",
            },
          },
        },
        VerifyOtpResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "Verification successful",
            },
            data: {
              type: "object",
              required: ["userId", "channel"],
              properties: {
                userId: { $ref: "#/components/schemas/ResourceId" },
                channel: {
                  type: "string",
                  enum: ["EMAIL"],
                  example: "EMAIL",
                },
              },
            },
          },
        },
        ForgotPasswordRequest: {
          type: "object",
          additionalProperties: false,
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              maxLength: 254,
              example: "ishwar@example.com",
            },
          },
        },
        ForgotPasswordResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "If the email exists, a reset code has been sent",
            },
            data: {
              type: "object",
              required: ["expiresAt", "resendAvailableInSeconds"],
              properties: {
                expiresAt: { type: "string", format: "date-time" },
                resendAvailableInSeconds: { type: "integer", example: 60 },
              },
            },
          },
        },
        ResetPasswordRequest: {
          type: "object",
          additionalProperties: false,
          required: ["email", "code", "newPassword"],
          properties: {
            email: {
              type: "string",
              format: "email",
              maxLength: 254,
              example: "ishwar@example.com",
            },
            code: {
              type: "string",
              pattern: "^\\d{6}$",
              description: "6-digit numeric code",
              example: "482193",
            },
            newPassword: {
              type: "string",
              format: "password",
              minLength: 8,
              maxLength: 128,
              writeOnly: true,
              example: "new-secure-password",
            },
          },
        },
        ResetPasswordResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "Password updated. Please sign in again.",
            },
            data: { type: "null" },
          },
        },
        LogoutResponse: {
          type: "object",
          required: ["message"],
          properties: {
            message: {
              type: "string",
              const: "Logged out successfully",
            },
          },
        },
        CurrentUser: {
          type: "object",
          required: [
            "id",
            "name",
            "email",
            "phone",
            "avatar",
            "bio",
            "lat",
            "lng",
            "role",
            "isOnboarded",
            "emailVerified",
            "phoneVerified",
            "loyaltyPoints",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            name: { type: ["string", "null"] },
            email: { type: ["string", "null"], format: "email" },
            phone: { type: ["string", "null"] },
            avatar: { type: ["string", "null"], format: "uri" },
            bio: { type: ["string", "null"] },
            lat: { type: ["number", "null"], format: "float" },
            lng: { type: ["number", "null"], format: "float" },
            role: {
              type: "string",
              enum: ["SUPER_ADMIN", "USER"],
            },
            isOnboarded: { type: "boolean" },
            emailVerified: { type: "boolean" },
            phoneVerified: { type: "boolean" },
            loyaltyPoints: { type: "integer" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CurrentUserResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "Current user",
            },
            data: {
              type: "object",
              required: ["user"],
              properties: {
                user: { $ref: "#/components/schemas/CurrentUser" },
              },
            },
          },
        },
        UpdateProfileRequest: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            name: {
              type: ["string", "null"],
              minLength: 2,
              maxLength: 100,
              example: "Ishwar Kumar",
            },
            avatar: {
              type: ["string", "null"],
              format: "uri",
              maxLength: 2048,
              example: "https://cdn.example.com/avatars/ishwar.png",
            },
            bio: {
              type: ["string", "null"],
              maxLength: 500,
              example: "Salon enthusiast based in Mumbai.",
            },
            lat: {
              type: ["number", "null"],
              format: "float",
              minimum: -90,
              maximum: 90,
              example: 19.076,
            },
            lng: {
              type: ["number", "null"],
              format: "float",
              minimum: -180,
              maximum: 180,
              example: 72.8777,
            },
          },
        },
        UpdatedProfileResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "Profile updated",
            },
            data: {
              type: "object",
              required: ["user"],
              properties: {
                user: { $ref: "#/components/schemas/CurrentUser" },
              },
            },
          },
        },
        ChangePasswordRequest: {
          type: "object",
          additionalProperties: false,
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: {
              type: "string",
              format: "password",
              minLength: 1,
              maxLength: 128,
              writeOnly: true,
              example: "old-secure-password",
            },
            newPassword: {
              type: "string",
              format: "password",
              minLength: 8,
              maxLength: 128,
              writeOnly: true,
              example: "brand-new-password-999",
            },
          },
        },
        DeleteAccountRequest: {
          type: "object",
          additionalProperties: false,
          required: ["password"],
          properties: {
            password: {
              type: "string",
              format: "password",
              minLength: 1,
              maxLength: 128,
              writeOnly: true,
              description:
                "Current password, used as a second factor to confirm deletion.",
              example: "your-current-password",
            },
          },
        },
        SuccessResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: { type: ["object", "null"] },
          },
        },
        ChangePasswordResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "Password updated successfully",
            },
            data: {
              type: "object",
              required: ["accessToken", "accessTokenExpiresIn"],
              properties: {
                accessToken: { type: "string" },
                accessTokenExpiresIn: { type: "integer", example: 900 },
              },
            },
          },
        },
        AuthSession: {
          type: "object",
          required: [
            "id",
            "userAgent",
            "ipAddress",
            "createdAt",
            "expiresAt",
            "isCurrent",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            userAgent: { type: ["string", "null"] },
            ipAddress: { type: ["string", "null"] },
            createdAt: { type: "string", format: "date-time" },
            expiresAt: { type: "string", format: "date-time" },
            isCurrent: { type: "boolean" },
          },
        },
        SessionListResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string", const: "Active sessions" },
            data: {
              type: "object",
              required: ["sessions"],
              properties: {
                sessions: {
                  type: "array",
                  items: { $ref: "#/components/schemas/AuthSession" },
                },
              },
            },
          },
        },
        LoginUserResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "Login successful",
            },
            data: {
              type: "object",
              required: ["user", "accessToken", "accessTokenExpiresIn"],
              properties: {
                user: { $ref: "#/components/schemas/PublicUser" },
                accessToken: {
                  type: "string",
                  description:
                    "Short-lived JWT (HS256). Send as `Authorization: Bearer <token>` " +
                    "for protected endpoints. Also set as an httpOnly cookie.",
                  example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOi...",
                },
                accessTokenExpiresIn: {
                  type: "integer",
                  description: "Access token lifetime in seconds.",
                  example: 900,
                },
              },
            },
          },
        },
        PublicUser: {
          type: "object",
          required: ["id", "name", "email", "phone", "createdAt"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            name: { type: ["string", "null"] },
            email: { type: ["string", "null"], format: "email" },
            phone: { type: ["string", "null"] },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        RegisterUserResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: {
              type: "string",
              const: "User registered successfully",
            },
            data: {
              type: "object",
              required: ["user"],
              properties: {
                user: { $ref: "#/components/schemas/PublicUser" },
              },
            },
          },
        },
        ValidationIssue: {
          type: "object",
          required: ["field", "message"],
          properties: {
            field: { type: "string", example: "email" },
            message: { type: "string", example: "Email format is invalid" },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          required: ["message", "errors"],
          properties: {
            message: { type: "string", const: "Validation failed" },
            errors: {
              type: "array",
              items: { $ref: "#/components/schemas/ValidationIssue" },
            },
          },
        },
        ErrorResponse: errorResponseSchema,
        HealthResponse: {
          type: "object",
          required: ["status", "database", "timestamp"],
          properties: {
            status: { type: "string", const: "ok" },
            database: { type: "string", const: "connected" },
            timestamp: { type: "string", format: "date-time" },
          },
        },
        UnhealthyResponse: {
          type: "object",
          required: ["status", "database", "timestamp"],
          properties: {
            status: { type: "string", const: "error" },
            database: { type: "string", const: "disconnected" },
            timestamp: { type: "string", format: "date-time" },
          },
        },

        // ============================================================
        // SALON SCHEMAS  ← YE BHI MISSING THE
        // ============================================================
        Salon: {
          type: "object",
          required: [
            "id",
            "name",
            "slug",
            "description",
            "category",
            "address",
            "city",
            "state",
            "zip",
            "country",
            "timezone",
            "lat",
            "lng",
            "placeId",
            "phone",
            "email",
            "images",
            "seoTitle",
            "seoDescription",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: ["string", "null"] },
            category: {
              type: "string",
              enum: ["MALE", "FEMALE", "UNISEX", "KIDS"],
            },
            address: { type: "string" },
            city: { type: "string" },
            state: { type: "string" },
            zip: { type: "string" },
            country: { type: "string" },
            timezone: { type: "string" },
            lat: { type: "number", format: "float" },
            lng: { type: "number", format: "float" },
            placeId: { type: ["string", "null"] },
            phone: { type: ["string", "null"] },
            email: { type: ["string", "null"], format: "email" },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
            },
            seoTitle: { type: ["string", "null"] },
            seoDescription: { type: ["string", "null"] },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateSalonRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name", "address", "city", "state", "zip", "lat", "lng"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
            description: { type: "string", maxLength: 2000 },
            category: {
              type: "string",
              enum: ["MALE", "FEMALE", "UNISEX", "KIDS"],
              default: "UNISEX",
            },
            address: { type: "string", minLength: 5, maxLength: 500 },
            city: { type: "string", maxLength: 80 },
            state: { type: "string", maxLength: 80 },
            zip: { type: "string", minLength: 3, maxLength: 12 },
            country: {
              type: "string",
              minLength: 2,
              maxLength: 2,
              default: "IN",
            },
            timezone: { type: "string", default: "Asia/Kolkata" },
            lat: { type: "number", minimum: -90, maximum: 90 },
            lng: { type: "number", minimum: -180, maximum: 180 },
            placeId: { type: "string", maxLength: 255 },
            phone: { type: "string", pattern: "^\\+[1-9]\\d{7,14}$" },
            email: { type: "string", format: "email", maxLength: 254 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 20,
              default: [],
            },
            seoTitle: { type: "string", maxLength: 70 },
            seoDescription: { type: "string", maxLength: 160 },
          },
        },
        UpdateSalonRequest: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
            description: { type: "string", maxLength: 2000 },
            category: {
              type: "string",
              enum: ["MALE", "FEMALE", "UNISEX", "KIDS"],
            },
            address: { type: "string", minLength: 5, maxLength: 500 },
            city: { type: "string", maxLength: 80 },
            state: { type: "string", maxLength: 80 },
            zip: { type: "string", minLength: 3, maxLength: 12 },
            country: { type: "string", minLength: 2, maxLength: 2 },
            timezone: { type: "string" },
            lat: { type: "number", minimum: -90, maximum: 90 },
            lng: { type: "number", minimum: -180, maximum: 180 },
            placeId: { type: "string", maxLength: 255 },
            phone: { type: "string", pattern: "^\\+[1-9]\\d{7,14}$" },
            email: { type: "string", format: "email", maxLength: 254 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 20,
            },
            seoTitle: { type: "string", maxLength: 70 },
            seoDescription: { type: "string", maxLength: 160 },
          },
        },
        SalonResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["salon"],
              properties: {
                salon: { $ref: "#/components/schemas/Salon" },
              },
            },
          },
        },
        PaginatedSalonsResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string", const: "Salons retrieved" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Salon" },
            },
            meta: {
              type: "object",
              required: ["nextCursor", "hasMore"],
              properties: {
                nextCursor: {
                  type: ["string", "null"],
                  format: "uuid",
                  description:
                    "Pass as the `cursor` query param to fetch the next page. Null when there are no more results.",
                },
                hasMore: { type: "boolean" },
              },
            },
          },
        },
        SalonMember: {
          type: "object",
          required: ["id", "userId", "salonId", "role", "user"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            userId: { $ref: "#/components/schemas/ResourceId" },
            salonId: { $ref: "#/components/schemas/ResourceId" },
            role: { type: "string", enum: ["OWNER", "MANAGER", "STAFF"] },
            user: {
              type: "object",
              required: ["id", "name", "email"],
              properties: {
                id: { $ref: "#/components/schemas/ResourceId" },
                name: { type: ["string", "null"] },
                email: { type: ["string", "null"], format: "email" },
              },
            },
          },
        },
        AddSalonMemberRequest: {
          type: "object",
          additionalProperties: false,
          required: ["userId", "role"],
          properties: {
            userId: { $ref: "#/components/schemas/ResourceId" },
            role: { type: "string", enum: ["OWNER", "MANAGER", "STAFF"] },
          },
        },
        SalonMemberResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["member"],
              properties: {
                member: { $ref: "#/components/schemas/SalonMember" },
              },
            },
          },
        },
        SalonMemberListResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/SalonMember" },
            },
          },
        },
        ServiceCategory: {
          type: "object",
          required: ["id", "name", "slug", "icon"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            name: { type: "string" },
            slug: { type: "string" },
            icon: { type: ["string", "null"] },
          },
        },
        Service: {
          type: "object",
          required: [
            "id",
            "salonId",
            "categoryId",
            "category",
            "name",
            "slug",
            "price",
            "duration",
            "isActive",
            "shortDescription",
            "description",
            "descriptionHtml",
            "descriptionJson",
            "seoTitle",
            "seoDescription",
            "images",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            salonId: { $ref: "#/components/schemas/ResourceId" },
            categoryId: {
              oneOf: [
                { $ref: "#/components/schemas/ResourceId" },
                { type: "null" },
              ],
            },
            category: {
              oneOf: [
                { $ref: "#/components/schemas/ServiceCategory" },
                { type: "null" },
              ],
            },
            name: { type: "string" },
            slug: { type: "string" },
            price: { type: "number", format: "double" },
            duration: { type: "integer" },
            isActive: { type: "boolean" },
            shortDescription: { type: ["string", "null"] },
            description: { type: ["string", "null"] },
            descriptionHtml: { type: ["string", "null"] },
            descriptionJson: { type: ["string", "null"] },
            seoTitle: { type: ["string", "null"] },
            seoDescription: { type: ["string", "null"] },
            images: { type: "array", items: { type: "string", format: "uri" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateServiceRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name", "price", "duration"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
            categoryId: { $ref: "#/components/schemas/ResourceId" },
            price: {
              type: "number",
              minimum: 0,
              maximum: 10000000,
              multipleOf: 0.01,
            },
            duration: { type: "integer", minimum: 5, maximum: 480 },
            isActive: { type: "boolean", default: true },
            shortDescription: { type: "string", maxLength: 280 },
            description: { type: "string", maxLength: 5000 },
            descriptionHtml: { type: "string" },
            descriptionJson: { type: "string" },
            seoTitle: { type: "string", maxLength: 70 },
            seoDescription: { type: "string", maxLength: 160 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 10,
              default: [],
            },
          },
        },
        UpdateServiceRequest: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
            categoryId: {
              oneOf: [
                { $ref: "#/components/schemas/ResourceId" },
                { type: "null" },
              ],
            },
            price: {
              type: "number",
              minimum: 0,
              maximum: 10000000,
              multipleOf: 0.01,
            },
            duration: { type: "integer", minimum: 5, maximum: 480 },
            isActive: { type: "boolean" },
            shortDescription: { type: ["string", "null"], maxLength: 280 },
            description: { type: ["string", "null"], maxLength: 5000 },
            descriptionHtml: { type: ["string", "null"] },
            descriptionJson: { type: ["string", "null"] },
            seoTitle: { type: ["string", "null"], maxLength: 70 },
            seoDescription: { type: ["string", "null"], maxLength: 160 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 10,
            },
          },
        },
        CreateCategoryRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 80 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
            icon: { type: "string", maxLength: 64 },
          },
        },
        ServiceResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["service"],
              properties: {
                service: { $ref: "#/components/schemas/Service" },
              },
            },
          },
        },
        CategoryResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["category"],
              properties: {
                category: { $ref: "#/components/schemas/ServiceCategory" },
              },
            },
          },
        },
        PaginatedServicesResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Service" },
            },
            meta: {
              type: "object",
              required: ["nextCursor", "hasMore"],
              properties: {
                nextCursor: { type: ["string", "null"] },
                hasMore: { type: "boolean" },
              },
            },
          },
        },
        PaginatedCategoriesResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/ServiceCategory" },
            },
            meta: {
              type: "object",
              required: ["nextCursor", "hasMore"],
              properties: {
                nextCursor: { type: ["string", "null"] },
                hasMore: { type: "boolean" },
              },
            },
          },
        },
        ProductCategory: {
          type: "object",
          required: ["id", "name", "slug"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            name: { type: "string" },
            slug: { type: "string" },
          },
        },
        Product: {
          type: "object",
          required: [
            "id",
            "salonId",
            "categoryId",
            "category",
            "name",
            "slug",
            "price",
            "stock",
            "isActive",
            "shortDescription",
            "description",
            "descriptionHtml",
            "descriptionJson",
            "seoTitle",
            "seoDescription",
            "images",
            "createdAt",
            "updatedAt",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            salonId: { $ref: "#/components/schemas/ResourceId" },
            categoryId: {
              oneOf: [
                { $ref: "#/components/schemas/ResourceId" },
                { type: "null" },
              ],
            },
            category: {
              oneOf: [
                { $ref: "#/components/schemas/ProductCategory" },
                { type: "null" },
              ],
            },
            name: { type: "string" },
            slug: { type: "string" },
            price: { type: "number", format: "double" },
            stock: { type: "integer" },
            isActive: { type: "boolean" },
            shortDescription: { type: ["string", "null"] },
            description: { type: ["string", "null"] },
            descriptionHtml: { type: ["string", "null"] },
            descriptionJson: { type: ["string", "null"] },
            seoTitle: { type: ["string", "null"] },
            seoDescription: { type: ["string", "null"] },
            images: { type: "array", items: { type: "string", format: "uri" } },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CreateProductRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name", "price"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
            categoryId: { $ref: "#/components/schemas/ResourceId" },
            price: {
              type: "number",
              minimum: 0,
              maximum: 10000000,
              multipleOf: 0.01,
            },
            stock: {
              type: "integer",
              minimum: 0,
              maximum: 1000000,
              default: 0,
            },
            isActive: { type: "boolean", default: true },
            shortDescription: { type: "string", maxLength: 280 },
            description: { type: "string", maxLength: 5000 },
            descriptionHtml: { type: "string", maxLength: 20000 },
            descriptionJson: { type: "string", maxLength: 50000 },
            seoTitle: { type: "string", maxLength: 70 },
            seoDescription: { type: "string", maxLength: 160 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 10,
              default: [],
            },
          },
        },
        UpdateProductRequest: {
          type: "object",
          additionalProperties: false,
          minProperties: 1,
          properties: {
            name: { type: "string", minLength: 2, maxLength: 120 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
            categoryId: {
              oneOf: [
                { $ref: "#/components/schemas/ResourceId" },
                { type: "null" },
              ],
            },
            price: {
              type: "number",
              minimum: 0,
              maximum: 10000000,
              multipleOf: 0.01,
            },
            stock: { type: "integer", minimum: 0, maximum: 1000000 },
            isActive: { type: "boolean" },
            shortDescription: { type: ["string", "null"], maxLength: 280 },
            description: { type: ["string", "null"], maxLength: 5000 },
            descriptionHtml: { type: ["string", "null"], maxLength: 20000 },
            descriptionJson: { type: ["string", "null"], maxLength: 50000 },
            seoTitle: { type: ["string", "null"], maxLength: 70 },
            seoDescription: { type: ["string", "null"], maxLength: 160 },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 10,
            },
          },
        },
        CreateProductCategoryRequest: {
          type: "object",
          additionalProperties: false,
          required: ["name"],
          properties: {
            name: { type: "string", minLength: 2, maxLength: 80 },
            slug: {
              type: "string",
              pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
              minLength: 2,
              maxLength: 80,
            },
          },
        },
        ProductResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["product"],
              properties: {
                product: { $ref: "#/components/schemas/Product" },
              },
            },
          },
        },
        ProductCategoryResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["category"],
              properties: {
                category: { $ref: "#/components/schemas/ProductCategory" },
              },
            },
          },
        },
        PaginatedProductsResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/Product" },
            },
            meta: {
              type: "object",
              required: ["nextCursor", "hasMore"],
              properties: {
                nextCursor: { type: ["string", "null"] },
                hasMore: { type: "boolean" },
              },
            },
          },
        },
        PaginatedProductCategoriesResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/ProductCategory" },
            },
            meta: {
              type: "object",
              required: ["nextCursor", "hasMore"],
              properties: {
                nextCursor: { type: ["string", "null"] },
                hasMore: { type: "boolean" },
              },
            },
          },
        },
        StaffMember: {
          type: "object",
          required: ["id", "userId", "salonId", "role", "user"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            userId: { $ref: "#/components/schemas/ResourceId" },
            salonId: { $ref: "#/components/schemas/ResourceId" },
            role: { type: "string", enum: ["OWNER", "MANAGER", "STAFF"] },
            user: {
              type: "object",
              required: ["id", "name", "email", "avatar"],
              properties: {
                id: { $ref: "#/components/schemas/ResourceId" },
                name: { type: ["string", "null"] },
                email: { type: ["string", "null"], format: "email" },
                avatar: { type: ["string", "null"], format: "uri" },
              },
            },
          },
        },
        ScheduleDay: {
          type: "object",
          required: ["id", "day", "startTime", "endTime", "isOff"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            day: {
              type: "string",
              enum: [
                "MONDAY",
                "TUESDAY",
                "WEDNESDAY",
                "THURSDAY",
                "FRIDAY",
                "SATURDAY",
                "SUNDAY",
              ],
            },
            startTime: {
              type: ["string", "null"],
              pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
            },
            endTime: {
              type: ["string", "null"],
              pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
            },
            isOff: { type: "boolean" },
          },
        },
        StaffLeave: {
          type: "object",
          required: [
            "id",
            "staffId",
            "salonId",
            "startDate",
            "endDate",
            "reason",
            "approved",
            "createdAt",
          ],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            staffId: { $ref: "#/components/schemas/ResourceId" },
            salonId: { $ref: "#/components/schemas/ResourceId" },
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            reason: { type: ["string", "null"] },
            approved: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        StaffSkill: {
          type: "object",
          required: ["serviceId", "experience", "service"],
          properties: {
            serviceId: { $ref: "#/components/schemas/ResourceId" },
            experience: { type: ["integer", "null"], minimum: 0, maximum: 80 },
            service: {
              type: "object",
              required: ["id", "name", "slug"],
              properties: {
                id: { $ref: "#/components/schemas/ResourceId" },
                name: { type: "string" },
                slug: { type: "string" },
              },
            },
          },
        },
        ReplaceScheduleRequest: {
          type: "object",
          additionalProperties: false,
          required: ["days"],
          properties: {
            days: {
              type: "array",
              minItems: 7,
              maxItems: 7,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["day"],
                properties: {
                  day: {
                    $ref: "#/components/schemas/ScheduleDay/properties/day",
                  },
                  startTime: {
                    type: "string",
                    pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
                  },
                  endTime: {
                    type: "string",
                    pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
                  },
                  isOff: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        CreateLeaveRequest: {
          type: "object",
          additionalProperties: false,
          required: ["startDate", "endDate"],
          properties: {
            startDate: { type: "string", format: "date-time" },
            endDate: { type: "string", format: "date-time" },
            reason: { type: "string", maxLength: 500 },
          },
        },
        UpdateLeaveRequest: {
          type: "object",
          additionalProperties: false,
          required: ["approved"],
          properties: { approved: { type: "boolean" } },
        },
        ReplaceSkillsRequest: {
          type: "object",
          additionalProperties: false,
          required: ["skills"],
          properties: {
            skills: {
              type: "array",
              maxItems: 100,
              uniqueItems: true,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["serviceId"],
                properties: {
                  serviceId: { $ref: "#/components/schemas/ResourceId" },
                  experience: { type: "integer", minimum: 0, maximum: 80 },
                },
              },
            },
          },
        },
        StaffResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["staff"],
              properties: {
                staff: { $ref: "#/components/schemas/StaffMember" },
              },
            },
          },
        },
        StaffListResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/StaffMember" },
            },
          },
        },
        PaginatedStaffResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/StaffMember" },
            },
            meta: {
              type: "object",
              required: ["nextCursor", "hasMore"],
              properties: {
                nextCursor: { type: ["string", "null"] },
                hasMore: { type: "boolean" },
              },
            },
          },
        },
        ScheduleResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["schedule"],
              properties: {
                schedule: {
                  type: "array",
                  items: { $ref: "#/components/schemas/ScheduleDay" },
                },
              },
            },
          },
        },
        LeaveResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["leave"],
              properties: {
                leave: { $ref: "#/components/schemas/StaffLeave" },
              },
            },
          },
        },
        PaginatedLeavesResponse: {
          type: "object",
          required: ["message", "data", "meta"],
          properties: {
            message: { type: "string" },
            data: {
              type: "array",
              items: { $ref: "#/components/schemas/StaffLeave" },
            },
            meta: {
              type: "object",
              required: ["nextCursor", "hasMore"],
              properties: {
                nextCursor: { type: ["string", "null"] },
                hasMore: { type: "boolean" },
              },
            },
          },
        },
        SkillsResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["skills"],
              properties: {
                skills: {
                  type: "array",
                  items: { $ref: "#/components/schemas/StaffSkill" },
                },
              },
            },
          },
        },
        ...oauthSchemas,
        ...couponSchemas,
        ...adminSchemas,
        ...aiSchemas,
        ...auditSchemas,
        ...blogSchemas,
        ...notificationSchemas,
        ...loyaltySchemas,
        ...appointmentSchemas,
        ...reviewSchemas,
        ...favoriteSchemas,
        ...mediaSchemas,
        WorkingHoursDay: {
          type: "object",
          required: ["id", "day", "openTime", "closeTime", "isClosed"],
          properties: {
            id: { $ref: "#/components/schemas/ResourceId" },
            day: {
              type: "string",
              enum: [
                "MONDAY",
                "TUESDAY",
                "WEDNESDAY",
                "THURSDAY",
                "FRIDAY",
                "SATURDAY",
                "SUNDAY",
              ],
            },
            openTime: {
              type: "string",
              pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
            },
            closeTime: {
              type: "string",
              pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
            },
            isClosed: { type: "boolean" },
          },
        },
        ReplaceWorkingHoursRequest: {
          type: "object",
          additionalProperties: false,
          required: ["days"],
          properties: {
            days: {
              type: "array",
              minItems: 7,
              maxItems: 7,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["day"],
                properties: {
                  day: {
                    type: "string",
                    enum: [
                      "MONDAY",
                      "TUESDAY",
                      "WEDNESDAY",
                      "THURSDAY",
                      "FRIDAY",
                      "SATURDAY",
                      "SUNDAY",
                    ],
                  },
                  openTime: {
                    type: "string",
                    pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
                  },
                  closeTime: {
                    type: "string",
                    pattern: "^([01]\\d|2[0-3]):[0-5]\\d$",
                  },
                  isClosed: { type: "boolean", default: false },
                },
              },
            },
          },
        },
        WorkingHoursResponse: {
          type: "object",
          required: ["message", "data"],
          properties: {
            message: { type: "string" },
            data: {
              type: "object",
              required: ["hours"],
              properties: {
                hours: {
                  type: "array",
                  items: { $ref: "#/components/schemas/WorkingHoursDay" },
                },
              },
            },
          },
        },
      },
    },
  };
}
