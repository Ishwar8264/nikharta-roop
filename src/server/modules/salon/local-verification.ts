import "server-only";

/** Explicit opt-in restricted to the dev runtime and a loopback PostgreSQL database. */
export function bypassLocalSalonVerification(): boolean {
  if (process.env.NODE_ENV !== "development" || process.env.LOCAL_SALON_VERIFICATION_BYPASS !== "true") return false;
  try {
    return ["localhost", "127.0.0.1", "[::1]"].includes(new URL(process.env.DATABASE_URL ?? "").hostname);
  } catch {
    return false;
  }
}
