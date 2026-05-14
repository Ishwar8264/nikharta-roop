// Data that the auth forms may need after a Server Action finishes.
// This intentionally excludes access/refresh tokens because tokens belong in
// HttpOnly cookies, not in client component state.
export type AuthActionData = {
  available?: boolean;
  canContinue?: boolean;
  devOtp?: string;
  exists?: boolean;
  identifier?: string;
  mobile?: string;
  redirectTo?: string;
  retryAfter?: number;
  type?: string;
};

export type AuthUser = {
  avatarUrl?: string | null;
  email?: string | null;
  id: string;
  mobile: string;
  name?: string | null;
  role?: string;
};

// Small serializable state returned from auth Server Actions to client forms.
// React can pass this safely across the server/client boundary.
export type AuthActionState = {
  code?: string;
  data?: AuthActionData;
  message: string;
  success: boolean;
};

export type AuthUserActionState = {
  message: string;
  success: boolean;
  user: AuthUser | null;
};
