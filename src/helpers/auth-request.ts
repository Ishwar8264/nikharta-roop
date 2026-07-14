import { NextRequest } from "next/server";

import type { AuthRequestContext } from "@/src/types/auth";

// Extract safe request metadata once so every auth endpoint records it consistently.
export const getAuthRequestContext = (
  request: NextRequest,
): AuthRequestContext => {
  // Read the first forwarded address because proxies append later network hops.
  const forwardedIp = request.headers.get("x-forwarded-for")?.split(",")[0];

  // Use the direct proxy header when no forwarded address is available.
  const directIp = request.headers.get("x-real-ip");

  // Trim the selected IP before storing it for auditing and throttling.
  const ipAddress = (forwardedIp ?? directIp)?.trim();

  // Capture the user agent to help identify the device behind an auth request.
  const userAgent = request.headers.get("user-agent") ?? undefined;

  // Return only metadata that the service layer needs.
  return { ipAddress, userAgent };
};
