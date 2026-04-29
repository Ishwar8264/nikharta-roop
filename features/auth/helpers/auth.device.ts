/**
 * Converts a raw User-Agent into a compact label shown in session lists.
 *
 * The raw userAgent is still stored for audits; this label is only for human
 * readability in account/session management screens.
 */
export function getDeviceName(userAgent: string | null) {
  if (!userAgent) {
    return null;
  }

  const browser = getBrowserName(userAgent);
  const platform = getPlatformName(userAgent);

  if (!browser && !platform) {
    return "Unknown device";
  }

  if (!browser) {
    return platform;
  }

  if (!platform) {
    return browser;
  }

  return `${browser} on ${platform}`;
}

function getBrowserName(userAgent: string) {
  if (userAgent.includes("Edg/")) {
    return "Edge";
  }

  if (userAgent.includes("OPR/") || userAgent.includes("Opera/")) {
    return "Opera";
  }

  if (userAgent.includes("Chrome/") || userAgent.includes("CriOS/")) {
    return "Chrome";
  }

  if (userAgent.includes("Firefox/") || userAgent.includes("FxiOS/")) {
    return "Firefox";
  }

  if (userAgent.includes("Safari/")) {
    return "Safari";
  }

  return null;
}

function getPlatformName(userAgent: string) {
  if (userAgent.includes("iPhone")) {
    return "iPhone";
  }

  if (userAgent.includes("iPad")) {
    return "iPad";
  }

  if (userAgent.includes("Android")) {
    return "Android";
  }

  if (userAgent.includes("Mac OS X") || userAgent.includes("Macintosh")) {
    return "macOS";
  }

  if (userAgent.includes("Windows")) {
    return "Windows";
  }

  if (userAgent.includes("Linux")) {
    return "Linux";
  }

  return null;
}
