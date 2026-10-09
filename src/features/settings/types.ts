/**
 * Browser-safe types for the account settings feature.
 *
 * Why mirror instead of importing from `src/server/**`:
 * The server `AuthSession` type carries `Date` fields that JSON-serialize to
 * strings on the wire, and the auth service module is `"server-only"`.
 * Re-declaring the wire shape here keeps the client bundle honest.
 */

/** Mirrors `AuthSession` — dates become ISO strings over JSON. */
export interface AuthSessionWire {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

/** Body for POST `/api/v1/auth/password/change`. */
export interface ChangePasswordBody {
  currentPassword: string;
  newPassword: string;
}

/** Body for DELETE `/api/v1/auth/account`. */
export interface DeleteAccountBody {
  password: string;
}

/** Result returned by DELETE `/api/v1/auth/session/{id}`. */
export interface RevokeSessionResult {
  /** Always true on 200; the API returns 404 when the session was not owned. */
  revoked: boolean;
  /** True when the revoked session was the cookie-backed one — client should sign out. */
  wasCurrent: boolean;
}
