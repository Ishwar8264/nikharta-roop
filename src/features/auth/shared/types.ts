/**
 * Shared auth types — safe for both server and client.
 *
 * Why this file has zero runtime:
 * It's imported by schemas, forms, hooks, and API functions. Keeping it
 * pure-TypeScript means it contributes 0 KB to the client bundle and can be
 * imported from anywhere without pulling zod or server-only code along.
 */

// ─────────────────────────────────────────────────────────────
// Core entities
// ─────────────────────────────────────────────────────────────

/**
 * The minimal user shape returned by auth endpoints.
 *
 * Why so few fields:
 * The register endpoint only returns id, name, email, phone, createdAt.
 * Modelling exactly what the backend sends prevents the UI from reading
 * fields that don't exist yet (avatar, bio, role) — those arrive later via
 * /auth/me after login.
 */
export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  createdAt: string;
}

/**
 * Full user shape returned by /auth/me and /auth/session.
 *
 * Why separate from AuthUser:
 * Register/login only expose { id, name, email, phone, createdAt }. The
 * /me endpoint returns the complete profile (avatar, bio, role, flags,
 * loyalty). Keeping two types stops the register form from reading fields
 * that don't exist in its response.
 *
 * Dates are strings here because this type is used in the browser, where
 * every Date arrives as an ISO string over JSON. Server code uses its own
 * CurrentUser (Date fields) from server/modules/auth.
 */
export interface CurrentUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  bio: string | null;
  lat: number | null;
  lng: number | null;
  role: string;
  isOnboarded: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  loyaltyPoints: number;
  /** Date — arrives via RSC serialization, not JSON. */
  createdAt: Date;
  updatedAt: Date;
}

/** Envelope for POST /auth/logout. */
export interface LogoutResponse {
  message: string;
}

// ─────────────────────────────────────────────────────────────
// Form inputs
// ─────────────────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  /** Optional. E.164 format if provided (e.g. +919876543210). */
  phone?: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

// ─────────────────────────────────────────────────────────────
// API envelopes
// ─────────────────────────────────────────────────────────────

/**
 * A single field-level validation error from the backend.
 *
 * Why this exact shape:
 * The register/login 400 handler returns `errors: [{ field, message }]`.
 * Modelling it 1:1 lets the hook map these straight onto form inputs
 * without a translation layer.
 */
export interface FieldError {
  field: string;
  message: string;
}

/** Envelope for successful register response. */
export interface RegisterResponse {
  message: string;
  data: { user: AuthUser };
}

/** Envelope for successful login response. */
export interface LoginResponse {
  message: string;
  data: {
    user: AuthUser;
    /** JWT for non-browser clients. Browser clients use HttpOnly cookies. */
    accessToken: string;
    /** Seconds until the access token expires (for proactive refresh). */
    accessTokenExpiresIn: number;
  };
}
/** Envelope for failed validation (400). */
export interface ValidationErrorResponse {
  message: string;
  errors: FieldError[];
}

// ─────────────────────────────────────────────────────────────
// OTP / Email Verification
// ─────────────────────────────────────────────────────────────

export interface SendOtpInput {
  email: string;
}

export interface VerifyOtpInput {
  email: string;
  code: string;
}

export interface SendOtpResponse {
  message: string;
  data: {
    channel: "EMAIL" | "PHONE" | "WHATSAPP";
    expiresAt: string;
    /** Seconds the user must wait before requesting another code. */
    resendAvailableInSeconds: number;
  };
}

export interface VerifyOtpResponse {
  message: string;
  data: {
    userId: string;
    channel: "EMAIL" | "PHONE" | "WHATSAPP";
  };
}
