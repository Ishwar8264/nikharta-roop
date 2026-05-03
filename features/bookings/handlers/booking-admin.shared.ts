import type { ZodError, ZodType } from "zod";

import { getDb } from "@/db";
import { getAuthenticatedSession } from "@/features/auth/handlers/auth.handlers";
import { readJsonBody } from "@/features/auth/helpers/auth.route-helpers";
import {
  BOOKING_CODES,
  BOOKING_MESSAGES,
} from "@/features/bookings/constants/booking.constants";
import {
  bookingError,
} from "@/features/bookings/responses/booking.responses";
import { HTTP_STATUS, type HttpStatus } from "@/lib/constants/http-status";

export type BookingAdminUser = {
  branchId?: string | null;
  id: string;
  role: string;
};

/**
 * Allows only admin roles to reach booking management handlers.
 */
export async function requireBookingAdmin(request: Request) {
  const auth = await getAuthenticatedSession(request);

  if (!auth.success) {
    return auth;
  }

  if (!["ADMIN", "SUPER_ADMIN"].includes(auth.session.user.role)) {
    return {
      error: bookingError({
        code: BOOKING_CODES.INVALID_STATUS_TRANSITION,
        message: BOOKING_MESSAGES.INVALID_STATUS_TRANSITION,
        status: HTTP_STATUS.FORBIDDEN,
      }),
      success: false as const,
    };
  }

  return auth;
}

/**
 * Parses admin JSON bodies with booking-owned validation errors.
 */
export async function parseBookingAdminBody<T>(
  request: Request,
  schema: ZodType<T>,
) {
  const parsed = schema.safeParse(await readJsonBody(request));

  if (!parsed.success) {
    return {
      data: null,
      error: bookingError({
        code: BOOKING_CODES.VALIDATION_ERROR,
        message: getValidationMessage(parsed.error),
        status: HTTP_STATUS.UNPROCESSABLE_ENTITY,
      }),
    };
  }

  return { data: parsed.data, error: null };
}

/**
 * Branch admins stay limited to their assigned branch; super admins are global.
 */
export function assertCanManageBookingBranch(
  admin: BookingAdminUser,
  branchId: string,
) {
  if (admin.role === "SUPER_ADMIN" || admin.branchId === branchId) return;

  throw new BookingAdminError(
    BOOKING_CODES.INVALID_STATUS_TRANSITION,
    BOOKING_MESSAGES.INVALID_STATUS_TRANSITION,
    HTTP_STATUS.FORBIDDEN,
  );
}

/**
 * Loads a booking and validates admin branch scope.
 */
export async function assertManageableBooking(
  bookingId: string,
  admin: BookingAdminUser,
) {
  const booking = await getDb().booking.findUnique({
    select: { branchId: true, id: true, status: true },
    where: { id: bookingId },
  });

  if (!booking) {
    throw new BookingAdminError(
      BOOKING_CODES.BOOKING_NOT_FOUND,
      BOOKING_MESSAGES.BOOKING_NOT_FOUND,
      HTTP_STATUS.NOT_FOUND,
    );
  }

  assertCanManageBookingBranch(admin, booking.branchId);
  return booking;
}

/**
 * Converts expected admin booking failures into API responses.
 */
export function handleAdminBookingError(error: unknown) {
  if (error instanceof BookingAdminError) {
    return bookingError({
      code: error.code,
      message: error.message,
      status: error.status,
    });
  }

  console.error(BOOKING_CODES.ADMIN_BOOKING_ACTION_FAILED, { error });
  return bookingError({
    code: BOOKING_CODES.ADMIN_BOOKING_ACTION_FAILED,
    message: BOOKING_MESSAGES.ADMIN_BOOKING_ACTION_FAILED,
    status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
  });
}

/**
 * Carries expected admin booking errors across helper boundaries.
 */
export class BookingAdminError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: HttpStatus,
  ) {
    super(message);
  }
}

function getValidationMessage(error: ZodError) {
  return error.issues[0]?.message ?? BOOKING_MESSAGES.VALIDATION_ERROR;
}
