"use server";

import { cookies, headers } from "next/headers";

import {
  handleLogin,
  handleLogout,
  handleMe,
  handleRegister,
  handleVerifyLogin,
  handleVerifyRegister,
} from "@/features/auth/handlers/auth.handlers";
import type {
  AuthActionState,
  AuthUser,
  AuthUserActionState,
} from "@/features/auth/actions/auth-action.types";
import { AUTH_COOKIE_NAMES } from "@/features/auth/helpers/auth.cookies";

// This type describes only the small part of the auth API response that the
// forms need. The handlers may return more data for API/mobile clients, but
// the frontend action contract should stay narrow and safe.
type AuthResponsePayload = {
  code?: string;
  data?: {
    accessToken?: string;
    devOtp?: string;
    expiresAt?: string;
    mobile?: string;
    refreshToken?: string;
    retryAfter?: number;
    session?: {
      expiresAt?: string;
    };
    user?: AuthUser;
  } | null;
  message?: string;
  success?: boolean;
};

const DEFAULT_ERROR_MESSAGE = "Something went wrong. Please try again.";

/**
 * Loads the current authenticated user for client UI chrome.
 *
 * This keeps the browser away from `/api/v1/auth/me`; the client asks this
 * Server Action for a safe user object, and the action reuses the same handler
 * that powers the API route.
 */
export async function getCurrentUserAction(): Promise<AuthUserActionState> {
  const response = await callAuthHandler(handleMe, {});
  const user = response.payload?.data?.user ?? null;

  return {
    message: response.payload?.message ?? DEFAULT_ERROR_MESSAGE,
    success: response.payload?.success === true && Boolean(user),
    user,
  };
}

/**
 * Logs out the current browser session.
 *
 * The browser does not fetch `/api/v1/auth/logout`. This action forwards the
 * current HttpOnly cookies to the existing logout handler so the session can be
 * revoked in the database, then clears the same cookies through Next's cookies
 * API to guarantee the browser receives expiry Set-Cookie headers.
 */
export async function logoutAction(): Promise<AuthActionState> {
  const response = await callAuthHandler(handleLogout, {});

  await clearBrowserAuthCookies();

  return {
    code: response.payload?.code,
    data: {
      redirectTo: "/signin",
    },
    message: response.payload?.message ?? "Logged out successfully.",
    success: response.payload?.success !== false,
  };
}

/**
 * Starts the signin OTP flow from the browser form.
 *
 * The client does not call `/api/v1/auth/login` directly. Instead, this Server
 * Action creates a server-side Request and reuses the existing auth handler so
 * validation, OTP creation, audit logging, and response shape stay consistent.
 */
export async function startSigninAction(
  formData: FormData,
): Promise<AuthActionState> {
  const response = await callAuthHandler(handleLogin, {
    mobile: getFormString(formData, "mobile"),
  });

  return toActionState(response, "/signin/verify-signin-otp");
}

/**
 * Completes signin after the user enters the OTP.
 *
 * The auth handler returns access/refresh tokens for API clients, but browser
 * sessions should use HttpOnly cookies. `persistAuthCookies` mirrors the token
 * response into cookies on the server before the client is redirected.
 */
export async function verifySigninAction(
  formData: FormData,
): Promise<AuthActionState> {
  const response = await callAuthHandler(handleVerifyLogin, {
    mobile: getFormString(formData, "mobile"),
    otp: getFormString(formData, "otp"),
  });

  await persistAuthCookies(response);

  return toActionState(response, "/account");
}

/**
 * Starts the signup OTP flow.
 *
 * At this stage the user is not created yet. The existing handler only creates
 * a SIGNUP OTP record and stores profile details in OTP metadata until the OTP
 * is verified.
 */
export async function startSignupAction(
  formData: FormData,
): Promise<AuthActionState> {
  const response = await callAuthHandler(handleRegister, {
    email: getFormString(formData, "email"),
    mobile: getFormString(formData, "mobile"),
    name: getFormString(formData, "name"),
  });

  return toActionState(response, "/signup/verify-otp");
}

/**
 * Completes signup after OTP verification.
 *
 * Successful verification creates the user, creates the auth session, and this
 * action stores the returned tokens as HttpOnly cookies for the browser.
 */
export async function verifySignupAction(
  formData: FormData,
): Promise<AuthActionState> {
  const response = await callAuthHandler(handleVerifyRegister, {
    mobile: getFormString(formData, "mobile"),
    otp: getFormString(formData, "otp"),
  });

  await persistAuthCookies(response);

  return toActionState(response, "/account");
}

/**
 * Calls one of the existing auth route handlers without doing a browser fetch.
 *
 * The project already has production-ready route handlers. Reusing them here
 * avoids duplicating auth logic while still keeping frontend wiring as Server
 * Actions instead of direct API calls.
 */
async function callAuthHandler(
  handler: (request: Request) => Promise<Response>,
  body: Record<string, string>,
) {
  const requestHeaders = await createForwardedHeaders();
  const request = new Request("http://nikharta-roop.local/auth-action", {
    body: JSON.stringify(body),
    headers: requestHeaders,
    method: "POST",
  });

  const response = await handler(request);
  const payload = (await response.json().catch(() => null)) as
    | AuthResponsePayload
    | null;

  return {
    payload,
    status: response.status,
  };
}

/**
 * Forwards request metadata that auth handlers need for audit and security.
 *
 * User agent and IP headers are used in auth event logs and session device
 * records. Existing cookies are forwarded so later actions can support flows
 * such as refresh/logout without exposing cookie values to client JavaScript.
 */
async function createForwardedHeaders() {
  const incomingHeaders = await headers();
  const cookieStore = await cookies();
  const forwardedHeaders = new Headers();

  forwardedHeaders.set("content-type", "application/json");

  const userAgent = incomingHeaders.get("user-agent");
  const forwardedFor = incomingHeaders.get("x-forwarded-for");
  const realIp = incomingHeaders.get("x-real-ip");

  if (userAgent) {
    forwardedHeaders.set("user-agent", userAgent);
  }

  if (forwardedFor) {
    forwardedHeaders.set("x-forwarded-for", forwardedFor);
  }

  if (realIp) {
    forwardedHeaders.set("x-real-ip", realIp);
  }

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");

  if (cookieHeader) {
    forwardedHeaders.set("cookie", cookieHeader);
  }

  return forwardedHeaders;
}

/**
 * Writes browser auth cookies from a successful verify response.
 *
 * The database stores hashed tokens, the handler returns raw tokens once, and
 * this action stores them in HttpOnly cookies. Client components never read or
 * store these token values.
 */
async function persistAuthCookies(response: {
  payload: AuthResponsePayload | null;
}) {
  if (!response.payload?.success || !response.payload.data) {
    return;
  }

  const { accessToken, refreshToken, session } = response.payload.data;
  const expiresAt = session?.expiresAt
    ? new Date(session.expiresAt)
    : undefined;

  if (!accessToken || !refreshToken || !expiresAt) {
    return;
  }

  const cookieStore = await cookies();
  const cookieOptions = {
    expires: expiresAt,
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  cookieStore.set(AUTH_COOKIE_NAMES.SESSION, accessToken, cookieOptions);
  cookieStore.set(AUTH_COOKIE_NAMES.REFRESH, refreshToken, cookieOptions);
}

/**
 * Clears auth cookies from the browser after logout.
 *
 * `handleLogout` also returns Set-Cookie headers, but Server Actions do not
 * automatically apply headers from a manually-created Response. Writing through
 * `cookies()` makes the deletion explicit and reliable for this action flow.
 */
async function clearBrowserAuthCookies() {
  const cookieStore = await cookies();
  const clearOptions = {
    expires: new Date(0),
    httpOnly: true,
    maxAge: 0,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };

  cookieStore.set(AUTH_COOKIE_NAMES.SESSION, "", clearOptions);
  cookieStore.set(AUTH_COOKIE_NAMES.REFRESH, "", clearOptions);
}

/**
 * Converts the handler response into a small serializable state for forms.
 *
 * The UI only needs success, message, redirect target, mobile, retryAfter, and
 * local-only dev OTP. Keeping the state small prevents API token fields from
 * becoming part of the client component state.
 */
function toActionState(
  response: {
    payload: AuthResponsePayload | null;
    status: number;
  },
  redirectPath: string,
): AuthActionState {
  const payload = response.payload;
  const mobile = payload?.data?.mobile;
  const redirectTo = payload?.success
    ? buildRedirectUrl(redirectPath, {
        devOtp: payload.data?.devOtp,
        mobile,
      })
    : undefined;

  return {
    code: payload?.code,
    data: {
      devOtp: payload?.data?.devOtp,
      mobile,
      redirectTo,
      retryAfter: payload?.data?.retryAfter,
    },
    message: payload?.message ?? DEFAULT_ERROR_MESSAGE,
    success: payload?.success === true && response.status < 400,
  };
}

/**
 * Safely reads string values from FormData.
 *
 * Browser forms can submit File objects too, so this helper guarantees actions
 * pass plain strings into the Zod schemas used by auth handlers.
 */
function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

/**
 * Builds the next page URL after OTP start or verification.
 *
 * In local development, the OTP is passed to the verify page so testing is
 * quick. Production handlers do not return `devOtp`, so no OTP query parameter
 * is generated there.
 */
function buildRedirectUrl(
  path: string,
  params: {
    devOtp?: string;
    mobile?: string;
  },
) {
  const searchParams = new URLSearchParams();

  if (params.mobile) {
    searchParams.set("mobile", params.mobile);
  }

  if (params.devOtp) {
    searchParams.set("devOtp", params.devOtp);
  }

  const query = searchParams.toString();

  return query ? `${path}?${query}` : path;
}
