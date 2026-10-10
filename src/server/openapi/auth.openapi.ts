import type { OpenAPIV3_1 } from "openapi-types";

/** Authentication paths: register, login, refresh, OTP, passwords, sessions. */
export const authPaths = {
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
} as unknown as OpenAPIV3_1.PathsObject;

/** Authentication schemas. */
export const authSchemas: Record<string, OpenAPIV3_1.SchemaObject> = {
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
            "coverImage",
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
            coverImage: { type: ["string", "null"], format: "uri" },
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
            coverImage: {
              type: ["string", "null"],
              format: "uri",
              maxLength: 2048,
              description: "Profile cover image URL. Set to null to remove it.",
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
};
