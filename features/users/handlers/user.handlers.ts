import { getDb } from "@/db";
import {
  getAuthenticatedSession,
  touchSession,
} from "@/features/auth/handlers/auth.handlers";
import { parseJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  USER_CODES,
  USER_MESSAGES,
} from "@/features/users/constants/user.constants";
import { toProfileUser } from "@/features/users/helpers/user.mapper";
import { userError, userJson } from "@/features/users/responses/user.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/schema/users/schema.user";

/**
 * Handles profile updates for the authenticated user.
 */
export async function handleUpdateProfile(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseJsonBody(request, updateProfileSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return updateProfile(auth.session.id, auth.session.userId, parsedBody.data);
}

/**
 * Updates editable profile fields without touching auth-sensitive columns.
 */
async function updateProfile(
  sessionId: string,
  userId: string,
  input: UpdateProfileInput,
) {
  const now = new Date();

  try {
    const user = await getDb().$transaction(async (tx) => {
      const currentUser = await tx.user.findUniqueOrThrow({
        select: {
          name: true,
          profileCompletedAt: true,
        },
        where: {
          id: userId,
        },
      });

      const nextName = input.name ?? currentUser.name;
      const shouldMarkProfileComplete =
        !currentUser.profileCompletedAt && Boolean(nextName);

      return tx.user.update({
        data: {
          email: input.email,
          name: input.name,
          profileCompletedAt: shouldMarkProfileComplete ? now : undefined,
        },
        select: profileUserSelect(),
        where: {
          id: userId,
        },
      });
    });

    await touchSession(sessionId);

    return userJson({
      code: USER_CODES.PROFILE_UPDATED,
      data: {
        user: toProfileUser(user),
      },
      message: USER_MESSAGES.PROFILE_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(USER_CODES.PROFILE_UPDATE_FAILED, {
      error,
      handler: "updateProfile",
      userId,
    });

    return userError({
      code: USER_CODES.PROFILE_UPDATE_FAILED,
      message: USER_MESSAGES.PROFILE_UPDATE_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Keeps profile responses from exposing private User columns.
 */
function profileUserSelect() {
  return {
    avatarUrl: true,
    branchId: true,
    email: true,
    id: true,
    mobile: true,
    mobileVerifiedAt: true,
    name: true,
    profileCompletedAt: true,
    role: true,
  } as const;
}
