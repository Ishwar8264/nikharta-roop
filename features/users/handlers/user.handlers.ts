import { BookingStatus, type Prisma } from "@prisma/client";

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
import {
  toCustomerAddress,
  toProfileUser,
  toUserBooking,
} from "@/features/users/helpers/user.mapper";
import { userError, userJson } from "@/features/users/responses/user.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";
import {
  createAddressSchema,
  type CreateAddressInput,
  updateAddressSchema,
  updateAvatarSchema,
  updateProfileSchema,
  type UpdateAddressInput,
  type UpdateAvatarInput,
  type UpdateProfileInput,
} from "@/schema/users/schema.user";

/**
 * Handles profile loading for the authenticated user.
 */
export async function handleGetProfile(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  return getProfile(auth.session.id, auth.session.userId);
}

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
 * Handles avatar URL updates after external storage upload.
 */
export async function handleUpdateAvatar(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseJsonBody(request, updateAvatarSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return updateAvatar(auth.session.id, auth.session.userId, parsedBody.data);
}

/**
 * Handles avatar removal for the authenticated user.
 */
export async function handleRemoveAvatar(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  return removeAvatar(auth.session.id, auth.session.userId);
}

/**
 * Handles address book loading for the authenticated user.
 */
export async function handleListAddresses(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  return listAddresses(auth.session.id, auth.session.userId);
}

/**
 * Handles customer address creation for the authenticated user.
 */
export async function handleCreateAddress(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseJsonBody(request, createAddressSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return createAddress(auth.session.id, auth.session.userId, parsedBody.data);
}

/**
 * Handles customer address updates for the authenticated user.
 */
export async function handleUpdateAddress(
  request: Request,
  addressId: string,
) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  const parsedBody = await parseJsonBody(request, updateAddressSchema);

  if (parsedBody.error) {
    return parsedBody.error;
  }

  return updateAddress(
    auth.session.id,
    auth.session.userId,
    addressId,
    parsedBody.data,
  );
}

/**
 * Handles customer address deletion for the authenticated user.
 */
export async function handleDeleteAddress(
  request: Request,
  addressId: string,
) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  return deleteAddress(auth.session.id, auth.session.userId, addressId);
}

/**
 * Handles booking history loading for the authenticated user.
 */
export async function handleGetBookingHistory(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth.error;
  }

  return getBookingHistory(auth.session.id, auth.session.userId, request.url);
}

/**
 * Loads the current user's profile-safe fields.
 */
async function getProfile(sessionId: string, userId: string) {
  try {
    const user = await getDb().user.findUniqueOrThrow({
      select: profileUserSelect(),
      where: {
        id: userId,
      },
    });

    await touchSession(sessionId);

    return userJson({
      code: USER_CODES.PROFILE_LOADED,
      data: {
        user: toProfileUser(user),
      },
      message: USER_MESSAGES.PROFILE_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(USER_CODES.PROFILE_LOAD_FAILED, {
      error,
      handler: "getProfile",
      userId,
    });

    return userError({
      code: USER_CODES.PROFILE_LOAD_FAILED,
      message: USER_MESSAGES.PROFILE_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
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
      if (input.branchId) {
        const branch = await tx.branch.findFirst({
          select: {
            id: true,
          },
          where: {
            id: input.branchId,
            isActive: true,
          },
        });

        if (!branch) {
          throw new UserVisibleError(
            USER_CODES.BRANCH_NOT_FOUND,
            USER_MESSAGES.BRANCH_NOT_FOUND,
            HTTP_STATUS.NOT_FOUND,
          );
        }
      }

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
          avatarUrl: input.avatarUrl,
          branchId: input.branchId,
          email: input.email,
          name: input.name,
          notificationPreferences: input.notificationPreferences,
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
    if (error instanceof UserVisibleError) {
      return userError({
        code: error.code,
        message: error.message,
        status: error.status,
      });
    }

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
 * Saves an externally hosted avatar URL on the current user's profile.
 */
async function updateAvatar(
  sessionId: string,
  userId: string,
  input: UpdateAvatarInput,
) {
  try {
    const user = await getDb().user.update({
      data: {
        avatarUrl: input.avatarUrl,
      },
      select: profileUserSelect(),
      where: {
        id: userId,
      },
    });

    await touchSession(sessionId);

    return userJson({
      code: USER_CODES.AVATAR_UPDATED,
      data: {
        avatarUrl: input.avatarUrl,
        user: toProfileUser(user),
      },
      message: USER_MESSAGES.AVATAR_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(USER_CODES.AVATAR_UPDATE_FAILED, {
      error,
      handler: "updateAvatar",
      userId,
    });

    return userError({
      code: USER_CODES.AVATAR_UPDATE_FAILED,
      message: USER_MESSAGES.AVATAR_UPDATE_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Clears the current user's avatar URL without touching external storage.
 */
async function removeAvatar(sessionId: string, userId: string) {
  try {
    const user = await getDb().user.update({
      data: {
        avatarUrl: null,
      },
      select: profileUserSelect(),
      where: {
        id: userId,
      },
    });

    await touchSession(sessionId);

    return userJson({
      code: USER_CODES.AVATAR_REMOVED,
      data: {
        avatarUrl: null,
        user: toProfileUser(user),
      },
      message: USER_MESSAGES.AVATAR_REMOVED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(USER_CODES.AVATAR_REMOVE_FAILED, {
      error,
      handler: "removeAvatar",
      userId,
    });

    return userError({
      code: USER_CODES.AVATAR_REMOVE_FAILED,
      message: USER_MESSAGES.AVATAR_REMOVE_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Lists the current user's saved addresses with default address first.
 */
async function listAddresses(sessionId: string, userId: string) {
  try {
    const addresses = await getDb().customerAddress.findMany({
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
      select: addressSelect(),
      where: {
        userId,
      },
    });

    await touchSession(sessionId);

    return userJson({
      code: USER_CODES.ADDRESS_LISTED,
      data: {
        addresses: addresses.map(toCustomerAddress),
      },
      message: USER_MESSAGES.ADDRESS_LISTED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(USER_CODES.ADDRESSES_LOAD_FAILED, {
      error,
      handler: "listAddresses",
      userId,
    });

    return userError({
      code: USER_CODES.ADDRESSES_LOAD_FAILED,
      message: USER_MESSAGES.ADDRESSES_LOAD_FAILED,
      status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
    });
  }
}

/**
 * Creates an address and promotes it to default when requested or first.
 */
async function createAddress(
  sessionId: string,
  userId: string,
  input: CreateAddressInput,
) {
  try {
    const address = await getDb().$transaction(async (tx) => {
      await assertBranchExists(tx, input.branchId);

      const existingAddressCount = await tx.customerAddress.count({
        where: {
          userId,
        },
      });
      const shouldMakeDefault = input.isDefault ?? existingAddressCount === 0;

      if (shouldMakeDefault) {
        await tx.customerAddress.updateMany({
          data: {
            isDefault: false,
          },
          where: {
            userId,
          },
        });
      }

      return tx.customerAddress.create({
        data: {
          ...input,
          isDefault: shouldMakeDefault,
          userId,
        },
        select: addressSelect(),
      });
    });

    await touchSession(sessionId);

    return userJson({
      code: USER_CODES.ADDRESS_CREATED,
      data: {
        address: toCustomerAddress(address),
      },
      message: USER_MESSAGES.ADDRESS_CREATED,
      status: HTTP_STATUS.CREATED,
      success: true,
    });
  } catch (error) {
    return handleAddressWriteError(error, "createAddress", userId);
  }
}

/**
 * Updates an owned address and keeps only one default address per user.
 */
async function updateAddress(
  sessionId: string,
  userId: string,
  addressId: string,
  input: UpdateAddressInput,
) {
  try {
    const address = await getDb().$transaction(async (tx) => {
      await assertBranchExists(tx, input.branchId);

      const existingAddress = await tx.customerAddress.findFirst({
        select: {
          id: true,
        },
        where: {
          id: addressId,
          userId,
        },
      });

      if (!existingAddress) {
        throw new UserVisibleError(
          USER_CODES.USER_ADDRESS_NOT_FOUND,
          USER_MESSAGES.USER_ADDRESS_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      if (input.isDefault) {
        await tx.customerAddress.updateMany({
          data: {
            isDefault: false,
          },
          where: {
            id: {
              not: addressId,
            },
            userId,
          },
        });
      }

      return tx.customerAddress.update({
        data: input,
        select: addressSelect(),
        where: {
          id: addressId,
        },
      });
    });

    await touchSession(sessionId);

    return userJson({
      code: USER_CODES.ADDRESS_UPDATED,
      data: {
        address: toCustomerAddress(address),
      },
      message: USER_MESSAGES.ADDRESS_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleAddressWriteError(error, "updateAddress", userId);
  }
}

/**
 * Deletes an owned address and promotes another address if needed.
 */
async function deleteAddress(
  sessionId: string,
  userId: string,
  addressId: string,
) {
  try {
    await getDb().$transaction(async (tx) => {
      const address = await tx.customerAddress.findFirst({
        select: {
          id: true,
          isDefault: true,
        },
        where: {
          id: addressId,
          userId,
        },
      });

      if (!address) {
        throw new UserVisibleError(
          USER_CODES.USER_ADDRESS_NOT_FOUND,
          USER_MESSAGES.USER_ADDRESS_NOT_FOUND,
          HTTP_STATUS.NOT_FOUND,
        );
      }

      await tx.customerAddress.delete({
        where: {
          id: addressId,
        },
      });

      if (address.isDefault) {
        const nextDefaultAddress = await tx.customerAddress.findFirst({
          orderBy: {
            updatedAt: "desc",
          },
          select: {
            id: true,
          },
          where: {
            userId,
          },
        });

        if (nextDefaultAddress) {
          await tx.customerAddress.update({
            data: {
              isDefault: true,
            },
            where: {
              id: nextDefaultAddress.id,
            },
          });
        }
      }
    });

    await touchSession(sessionId);

    return userJson({
      code: USER_CODES.ADDRESS_DELETED,
      data: {
        addressId,
      },
      message: USER_MESSAGES.ADDRESS_DELETED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleAddressWriteError(error, "deleteAddress", userId);
  }
}

/**
 * Returns recent bookings for the current user with optional filters.
 */
async function getBookingHistory(
  sessionId: string,
  userId: string,
  requestUrl: string,
) {
  const url = new URL(requestUrl);
  const status = url.searchParams.get("status");
  const bookingStatus = status && isBookingStatus(status) ? status : undefined;
  const limitParam = Number(url.searchParams.get("limit") ?? 20);
  const limit = Number.isInteger(limitParam)
    ? Math.min(Math.max(limitParam, 1), 50)
    : 20;

  if (status && !isBookingStatus(status)) {
    return userError({
      code: USER_CODES.VALIDATION_ERROR,
      message: "Booking status is invalid.",
      status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
    });
  }

  try {
    const bookings = await getDb().booking.findMany({
      orderBy: [{ bookingDate: "desc" }, { slotStart: "desc" }],
      select: bookingHistorySelect(),
      take: limit,
      where: {
        status: bookingStatus,
        userId,
      },
    });

    await touchSession(sessionId);

    return userJson({
      code: USER_CODES.BOOKING_HISTORY_LOADED,
      data: {
        bookings: bookings.map(toUserBooking),
        limit,
      },
      message: USER_MESSAGES.BOOKING_HISTORY_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    console.error(USER_CODES.BOOKING_HISTORY_LOAD_FAILED, {
      error,
      handler: "getBookingHistory",
      userId,
    });

    return userError({
      code: USER_CODES.BOOKING_HISTORY_LOAD_FAILED,
      message: USER_MESSAGES.BOOKING_HISTORY_LOAD_FAILED,
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
    notificationPreferences: true,
    profileCompletedAt: true,
    role: true,
  } as const;
}

/**
 * Keeps address responses consistent and excludes internal relation data.
 */
function addressSelect() {
  return {
    branchId: true,
    city: true,
    createdAt: true,
    id: true,
    isDefault: true,
    label: true,
    landmark: true,
    latitude: true,
    line1: true,
    line2: true,
    longitude: true,
    mobile: true,
    postalCode: true,
    recipientName: true,
    state: true,
    updatedAt: true,
  } as const;
}

/**
 * Selects compact booking fields needed by the user booking history screen.
 */
function bookingHistorySelect() {
  return {
    bookingDate: true,
    branch: {
      select: {
        city: true,
        id: true,
        nameEn: true,
        nameHi: true,
      },
    },
    createdAt: true,
    displayId: true,
    id: true,
    package: {
      select: {
        id: true,
        nameEn: true,
        nameHi: true,
      },
    },
    service: {
      select: {
        id: true,
        nameEn: true,
        nameHi: true,
      },
    },
    serviceVariant: {
      select: {
        id: true,
        nameEn: true,
        nameHi: true,
      },
    },
    slotEnd: true,
    slotStart: true,
    staff: {
      select: {
        id: true,
        user: {
          select: {
            name: true,
          },
        },
      },
    },
    status: true,
    totalAmount: true,
    updatedAt: true,
  } as const;
}

/**
 * Ensures optional branch references point to an active branch.
 */
async function assertBranchExists(
  tx: Prisma.TransactionClient,
  branchId: string | null | undefined,
) {
  if (!branchId) {
    return;
  }

  const branch = await tx.branch.findFirst({
    select: {
      id: true,
    },
    where: {
      id: branchId,
      isActive: true,
    },
  });

  if (!branch) {
    throw new UserVisibleError(
      USER_CODES.BRANCH_NOT_FOUND,
      USER_MESSAGES.BRANCH_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }
}

/**
 * Converts expected address write failures into user-safe API responses.
 */
function handleAddressWriteError(error: unknown, handler: string, userId: string) {
  if (error instanceof UserVisibleError) {
    return userError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }

  console.error(USER_CODES.ADDRESS_WRITE_FAILED, {
    error,
    handler,
    userId,
  });

  return userError({
    code: USER_CODES.ADDRESS_WRITE_FAILED,
    message: USER_MESSAGES.ADDRESS_WRITE_FAILED,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Validates booking status query params against Prisma enum values.
 */
function isBookingStatus(status: string): status is BookingStatus {
  return Object.values(BookingStatus).includes(status as BookingStatus);
}

/**
 * Carries expected user-facing errors through transactional code paths.
 */
class UserVisibleError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}
