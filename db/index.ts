import { PrismaClient } from "@prisma/client";

declare global {
  var __nikhartaPrisma: PrismaClient | undefined;
}

/**
 * Returns a singleton Prisma client.
 *
 * In development, Next.js hot reload can re-evaluate modules many times.
 * Storing the client on `globalThis` prevents opening a new database
 * connection pool on every reload.
 */
export function getDb() {
  const client = globalThis.__nikhartaPrisma ?? new PrismaClient();

  if (process.env.NODE_ENV !== "production") {
    globalThis.__nikhartaPrisma = client;
  }

  return client;
}

export type Database = ReturnType<typeof getDb>;
