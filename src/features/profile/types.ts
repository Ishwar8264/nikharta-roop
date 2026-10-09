/**
 * Browser-safe types for the profile feature.
 *
 * Why mirror instead of importing from `src/server/**`:
 * The wiring constraints forbid importing server modules into Client
 * Components, and the server `CurrentUser` type carries `Date` fields that
 * JSON-serialize to strings on the wire. Re-declaring the wire shape here
 * keeps the client types honest and lets the client bundle stay lean.
 */

/** Mirrors `CurrentUser` — dates become ISO strings over JSON. */
export interface CurrentUserWire {
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
  createdAt: string;
  updatedAt: string;
}

/**
 * Body for PATCH `/api/v1/auth/me`.
 *
 * Why this shape matches the server's `updateProfileSchema`:
 * The server marks `phone`, `email`, `role`, and verification flags as
 * immutable — clients cannot mutate them through this endpoint. Only
 * `name`, `avatar`, `bio`, and the optional lat/lng are accepted.
 */
export interface UpdateProfileBody {
  name?: string | null;
  avatar?: string | null;
  bio?: string | null;
  lat?: number | null;
  lng?: number | null;
}

/** Props for the profile edit form (client component). */
export interface ProfileFormProps {
  initial: CurrentUserWire;
}
