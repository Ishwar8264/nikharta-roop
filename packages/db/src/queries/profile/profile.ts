import "server-only";

import type { CreateProfileInput, UpdateProfileInput, UserProfile } from "@nikharta-roop/shared";
import { prisma } from "../../client";

const profileSelection = {
  id: true,
  status: true,
  slug: true,
  displayName: true,
  bio: true,
  avatar: true,
} as const;

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
    select: profileSelection,
  });
}

/** Ownership comes exclusively from the verified session, never from request input. */
export function findProfileRecord(userId: string): Promise<UserProfile | null> {
  return prisma.userProfile.findUnique({ where: { userId }, select: profileSelection });
}

/** Partial updates preserve omitted fields and rely on the unique slug index for conflicts. */
export function updateProfileRecord(
  userId: string,
  slug: string,
  profileInput: UpdateProfileInput,
): Promise<UserProfile> {
  return prisma.userProfile.update({
    // Match ownership and the requested slug atomically, including during slug changes.
    where: { slug, userId },
    data: profileInput,
    select: profileSelection,
  });
}

/** Remove only the public profile; account and salon records are independent. */
export async function deleteProfileRecord(slug: string): Promise<void> {
  await prisma.userProfile.delete({ where: { slug }, select: { id: true } });
}
