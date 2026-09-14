import "server-only";

import { prisma } from "@/lib/prisma";

import type { HealthStatus } from "./health.types";

/**
 * Checks the database with the smallest practical read query.
 *
 * Why:
 * A successful HTTP response alone cannot prove that the application can
 * serve database-backed requests.
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  await prisma.$queryRaw`SELECT 1`;

  return {
    status: "ok",
    database: "connected",
    timestamp: new Date().toISOString(),
  };
}
