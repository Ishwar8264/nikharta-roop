import "server-only";

import { cookies, headers } from "next/headers";

// Builds headers for server-side calls into existing route handlers.
export async function createServerApiHeaders() {
  const incomingHeaders = await headers();
  const cookieStore = await cookies();
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

// Keeps security/audit metadata available to API handlers.
function copyHeader(source: Headers, target: Headers, key: string) {
  const value = source.get(key);

  if (value) {
    target.set(key, value);
  }
}
