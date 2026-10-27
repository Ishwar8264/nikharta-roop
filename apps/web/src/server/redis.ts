import "server-only";

import { Redis } from "@upstash/redis";

let client: Redis | undefined;

/** Lazily initialize so building the app never makes a Redis connection. */
export function getRedis(): Redis {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Upstash Redis is not configured");
  client = new Redis({
    url,
    token,
    automaticDeserialization: false,
    signal: () => AbortSignal.timeout(5000),
  });
  return client;
}

const keyFor = (key: string) => `nikharta-roop:auth:${key}`;

/** Better Auth owns serialization; namespace keys so another app cannot share sessions. */
export const authStorage = {
  get: (key: string) => getRedis().get<string>(keyFor(key)),
  async set(key: string, value: string, ttl?: number) {
    if (ttl) await getRedis().set(keyFor(key), value, { ex: ttl });
    else await getRedis().set(keyFor(key), value);
  },
  async delete(key: string) {
    await getRedis().del(keyFor(key));
  },
  getAndDelete: (key: string) => getRedis().getdel<string>(keyFor(key)),
  async increment(key: string, ttl: number) {
    if (!Number.isInteger(ttl) || ttl <= 0) throw new Error("Invalid Redis expiry");
    return Number(
      await getRedis().eval(
        "local n=redis.call('incr',KEYS[1]); if n==1 then redis.call('expire',KEYS[1],ARGV[1]) end; return n",
        [keyFor(key)],
        [ttl],
      ),
    );
  },
};
