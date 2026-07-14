import { PrismaClient } from "@prisma/client";

// Preserve one Prisma client across Next.js development hot reloads.
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Reuse the cached client or create the application's database client once.
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Keep verbose SQL logs local and expose only database errors in production.
    log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "error"],
  });

// Cache the client only during development to prevent duplicate connection pools.
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
