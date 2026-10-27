import "server-only";

import type { CreateProfileInput, Profile } from "@nikharta-roop/shared";
import { prisma } from "../../client";

/** Unique slug and personalUserId indexes enforce conflicts even for simultaneous requests. */
export function createProfileRecord(userId: string, input: CreateProfileInput): Promise<Profile> {
  return prisma.profile.create({
    data: {
      type: "PERSONAL",
      personalUserId: userId,
      displayName: input.displayName,
      slug: input.slug,
      bio: input.bio,
      avatar: input.avatar,
    },
    select: {
      id: true,
      type: true,
      status: true,
      slug: true,
      displayName: true,
      bio: true,
      avatar: true,
    },
  });
}
