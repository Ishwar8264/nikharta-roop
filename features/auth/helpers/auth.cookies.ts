type AuthCookieInput = {
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  sessionToken: string;
  sessionTokenExpiresAt: Date;
};

export const AUTH_COOKIE_NAMES = {
  REFRESH: "nr_refresh",
  SESSION: "nr_session",
} as const;

const COOKIE_PATH = "/";

/**
 * Builds Set-Cookie headers for browser clients.
 *
 * Tokens stay available in response bodies for API/mobile clients, while web
 * clients can rely on HttpOnly cookies to reduce token exposure to XSS.
 */
export function createAuthCookieHeaders(input: AuthCookieInput) {
  return [
    serializeCookie({
      expires: input.sessionTokenExpiresAt,
      httpOnly: true,
      name: AUTH_COOKIE_NAMES.SESSION,
      sameSite: "Lax",
      value: input.sessionToken,
    }),
    serializeCookie({
      expires: input.refreshTokenExpiresAt,
      httpOnly: true,
      name: AUTH_COOKIE_NAMES.REFRESH,
      sameSite: "Lax",
      value: input.refreshToken,
    }),
  ];
}

export function createClearAuthCookieHeaders() {
  const expires = new Date(0);

  return [
    serializeCookie({
      expires,
      httpOnly: true,
      maxAge: 0,
      name: AUTH_COOKIE_NAMES.SESSION,
      sameSite: "Lax",
      value: "",
    }),
    serializeCookie({
      expires,
      httpOnly: true,
      maxAge: 0,
      name: AUTH_COOKIE_NAMES.REFRESH,
      sameSite: "Lax",
      value: "",
    }),
  ];
}

/**
 * Reads one cookie value from a standard Cookie header.
 */
export function getCookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  for (const cookie of cookieHeader.split(";")) {
    const [rawName, ...rawValue] = cookie.trim().split("=");

    if (rawName === name) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
}

/**
 * Creates Headers with multiple Set-Cookie values preserved.
 */
export function headersWithSetCookies(cookies: string[]) {
  const headers = new Headers();

  for (const cookie of cookies) {
    headers.append("set-cookie", cookie);
  }

  return headers;
}

/**
 * Serializes one cookie using the project's auth cookie policy.
 */
function serializeCookie(input: {
  expires: Date;
  httpOnly: boolean;
  maxAge?: number;
  name: string;
  sameSite: "Lax" | "Strict";
  value: string;
}) {
  const cookie = [
    `${input.name}=${encodeURIComponent(input.value)}`,
    `Path=${COOKIE_PATH}`,
    `Expires=${input.expires.toUTCString()}`,
    `SameSite=${input.sameSite}`,
  ];

  if (input.maxAge !== undefined) {
    cookie.push(`Max-Age=${input.maxAge}`);
  }

  if (input.httpOnly) {
    cookie.push("HttpOnly");
  }

  if (process.env.NODE_ENV === "production") {
    cookie.push("Secure");
  }

  return cookie.join("; ");
}
