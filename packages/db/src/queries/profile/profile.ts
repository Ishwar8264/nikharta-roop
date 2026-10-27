import "server-only";

import type { CreateProfileInput, UserProfile } from "@nikharta-roop/shared";
import { prisma } from "../../client";

/** Unique slug and userId indexes enforce conflicts even for simultaneous requests. */
export function createProfileRecord(
  userId: string,
  profileInput: CreateProfileInput,
): Promise<UserProfile> {
  return prisma.userProfile.create({
    data: {
      userId,
      displayName: profileInput.displayName,
      slug: profileInput.slug,
      bio: profileInput.bio,
      avatar: profileInput.avatar,
    },
    select: {
      id: true,
      status: true,
      slug: true,
      displayName: true,
      bio: true,
      avatar: true,
    },
  });
}
