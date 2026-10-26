import "server-only";

import { createHash } from "node:crypto";

import { redis } from "@/lib/rate-limit";
import { LOGIN_LOCKOUT_MS, LOGIN_LOCKOUT_THRESHOLD } from "./auth.constants";

type LockEntry = { failures: number; lockedUntil: number | null; expiresAt: number };
const store = new Map<string, LockEntry>();

/** Hash normalized identifiers so Redis keys do not contain email addresses. */
function lockoutKey(identifier: string): string {
  return `auth:login-lockout:${createHash("sha256").update(identifier.trim().toLowerCase()).digest("hex")}`;
}

// One atomic operation elects the alert sender and fixes the lock duration.
const RECORD_FAILURE = `
local locked = redis.call('HGET', KEYS[1], 'locked')
if locked then return 0 end
local failures = redis.call('HINCRBY', KEYS[1], 'failures', 1)
if failures == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[2]) end
if failures >= tonumber(ARGV[1]) then
  redis.call('HSET', KEYS[1], 'locked', '1')
  redis.call('PEXPIRE', KEYS[1], ARGV[2])
  return 1
end
return 0
`;
const READ_LOCK = `
if redis.call('HGET', KEYS[1], 'locked') then
  return math.max(0, redis.call('PTTL', KEYS[1]))
end
return 0
`;

/** Shared production lockout; expired local entries are pruned in development. */
export async function lockoutRetryAfterSeconds(identifier: string): Promise<number> {
  const key = lockoutKey(identifier);
  if (redis) return Math.ceil((await redis.eval<unknown[], number>(READ_LOCK, [key], [])) / 1000);
  pruneExpiredEntries();
  const lockedUntil = store.get(key)?.lockedUntil;
  return lockedUntil ? Math.max(0, Math.ceil((lockedUntil - Date.now()) / 1000)) : 0;
}

/** Returns true only for the failure that starts a new lockout. */
export async function recordFailedAttempt(identifier: string): Promise<boolean> {
  const key = lockoutKey(identifier);
  if (redis) {
    return (await redis.eval<unknown[], number>(RECORD_FAILURE, [key], [LOGIN_LOCKOUT_THRESHOLD, LOGIN_LOCKOUT_MS])) === 1;
  }
  pruneExpiredEntries();
  const now = Date.now();
  const entry = store.get(key) ?? { failures: 0, lockedUntil: null, expiresAt: now + LOGIN_LOCKOUT_MS };
  if (entry.lockedUntil) return false;
  entry.failures += 1;
  const triggered = entry.failures >= LOGIN_LOCKOUT_THRESHOLD;
  if (triggered) entry.expiresAt = entry.lockedUntil = now + LOGIN_LOCKOUT_MS;
  store.set(key, entry);
  return triggered;
}

/** Clear failures after successful password authentication. */
export async function clearLockout(identifier: string): Promise<void> {
  const key = lockoutKey(identifier);
  if (redis) await redis.del(key);
  else store.delete(key);
}

/** Bound the lifetime of local counters, including identifiers never retried. */
function pruneExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
}
