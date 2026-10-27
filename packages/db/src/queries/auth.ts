import "server-only";

import { prismaAdapter } from "@better-auth/prisma-adapter";
import { prisma } from "../client";

/** Better Auth owns its credential/session queries behind the DB package boundary. */
export function createAuthDatabase() {
  return prismaAdapter(prisma, { provider: "postgresql", transaction: true });
}

export function findAuthAccount(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      emailVerified: true,
      image: true,
      role: true,
      status: true,
      deletedAt: true,
    },
  });
}

/** Verification must never reactivate an account suspended or deleted by an administrator. */
export function activateVerifiedAccount(userId: string) {
  return prisma.user.updateMany({
    where: { id: userId, status: "PENDING_VERIFICATION", deletedAt: null, emailVerified: true },
    data: { status: "ACTIVE" },
  });
}
