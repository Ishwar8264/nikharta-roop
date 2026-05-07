import type { Prisma } from "@prisma/client";

/**
 * Selects auth event fields exposed by admin audit-log APIs.
 */
export const authEventSelect = () =>
  ({
    createdAt: true,
    id: true,
    ipAddress: true,
    metadata: true,
    mobile: true,
    type: true,
    user: {
      select: {
        branchId: true,
        id: true,
        mobile: true,
        name: true,
        role: true,
      },
    },
    userAgent: true,
    userId: true,
  }) satisfies Prisma.AuthEventSelect;
