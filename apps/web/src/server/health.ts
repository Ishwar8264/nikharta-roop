import "server-only";

import { checkDatabaseHealth } from "@/server/db";
import { getRedis } from "@/server/redis";

/** Bound the response time; dependency errors never expose credentials or internal addresses. */
async function checkWithinBudget(check: Promise<unknown>): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      check,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("Health check timed out")), 2000);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function getHealthStatus() {
  const [database, redis] = await Promise.all([
    checkWithinBudget(checkDatabaseHealth()),
    checkWithinBudget(getRedis().ping()),
  ]);
  return {
    status: database && redis ? ("ok" as const) : ("degraded" as const),
    checks: { database: database ? "up" : "down", redis: redis ? "up" : "down" },
  };
}
