/**
 * Purpose: Build request headers for server-side calls into internal API handlers.
 * Responsibilities: forward auth cookies plus audit headers such as user agent and client IP.
 * Important notes: callers still authenticate Server Actions before forwarding to protected handlers.
 */
import "server-only";

import { cookies, headers } from "next/headers";

/**
 * Builds headers for server-side calls into existing route handlers.
 */
export async function createServerApiHeaders() {
  const [incomingHeaders, cookieStore] = await Promise.all([
    headers(),
    cookies(),
  ]);
  const requestHeaders = new Headers();

  requestHeaders.set("content-type", "application/json");

  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${encodeURIComponent(value)}`)
    .join("; ");

  if (cookieHeader) {
    requestHeaders.set("cookie", cookieHeader);
  }

  copyHeader(incomingHeaders, requestHeaders, "user-agent");
  copyHeader(incomingHeaders, requestHeaders, "x-forwarded-for");
  copyHeader(incomingHeaders, requestHeaders, "x-real-ip");

  return requestHeaders;
}

/**
 * Copies one request metadata header when the current request provided it.
 */
function copyHeader(source: Headers, target: Headers, key: string) {
  const value = source.get(key);

  if (value) {
    target.set(key, value);
  }
}
