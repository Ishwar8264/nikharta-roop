import "server-only";

import { prisma } from "../client";

/** Verify connectivity without reading application data or changing the database. */
export async function checkDatabaseHealth(): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;
}
