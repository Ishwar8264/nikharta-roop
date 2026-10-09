/**
 * Client-side API wrappers for the account settings feature.
 *
 * Why these wrappers live here (instead of in the auth feature folder):
 * The `auth` feature folder owns entry flows (login, register, OTP). Account
 * maintenance — change password, manage sessions, delete account — is a
 * distinct concern reachable only after sign-in. Keeping them here lets the
 * auth folder stay focused on identity proofing.
 */

import { api } from "@/lib/api/backend.client";

import type {
  AuthSessionWire,
  ChangePasswordBody,
  DeleteAccountBody,
} from "./types";

type SessionsResponse = {
  message: string;
  data: { sessions: AuthSessionWire[] };
};

/** Changes the caller's password and rotates the active session. */
export function changePasswordApi(body: ChangePasswordBody) {
  return api.post<{ message: string; data: { accessTokenExpiresIn: number } }>(
    "/auth/password/change",
    body,
  );
}

/** Lists every active refresh session owned by the caller. */
export function listSessionsApi() {
  return api.get<SessionsResponse>("/auth/session");
}

/** Revokes one user-owned session. */
export function revokeSessionApi(sessionId: string) {
  return api.delete<{ message: string; data: null }>(
    `/auth/session/${encodeURIComponent(sessionId)}`,
  );
}

/**
 * Soft-deletes the caller's account.
 *
 * Why `deleteWithBody`:
 * The `/auth/account` DELETE route requires the current password in the body
 * as a second factor. The shared `api.delete` types options as
 * `RequestOptions` (no `json` field), so we use the dedicated method that
 * accepts a JSON body. The route clears session cookies on success — the
 * caller should redirect to a signed-out destination afterwards.
 */
export function deleteAccountApi(body: DeleteAccountBody) {
  return api.deleteWithBody<{ message: string; data: null }>(
    "/auth/account",
    body,
  );
}
