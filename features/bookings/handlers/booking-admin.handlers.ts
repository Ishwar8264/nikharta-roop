import { BookingStatus } from "@prisma/client";

import { getDb } from "@/db";
import {
  BOOKING_CODES,
  BOOKING_MESSAGES,
} from "@/features/bookings/constants/booking.constants";
import { toPublicBooking } from "@/features/bookings/helpers/booking.mapper";
import { bookingSelect } from "@/features/bookings/helpers/booking.selectors";
import { bookingJson } from "@/features/bookings/responses/booking.responses";
import { HTTP_STATUS } from "@/lib/constants/http-status";
import {
  adminListBookingsQuerySchema,
  type AdminListBookingsQueryInput,
} from "@/schema/bookings/schema.booking";
import {
  assertManageableBooking,
  BookingAdminError,
  type BookingAdminUser,
  handleAdminBookingError,
  requireBookingAdmin,
} from "./booking-admin.shared";

const STATUS_TRANSITIONS: Record<string, BookingStatus[]> = {
  [BookingStatus.PENDING]: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  [BookingStatus.CONFIRMED]: [
    BookingStatus.IN_PROGRESS,
    BookingStatus.CANCELLED,
    BookingStatus.NO_SHOW,
  ],
  [BookingStatus.IN_PROGRESS]: [BookingStatus.COMPLETED],
};

export async function handleAdminListBookings(request: Request) {
  const auth = await requireBookingAdmin(request);
  if (!auth.success) return auth.error;

  const parsed = adminListBookingsQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return handleAdminBookingError(parsed.error);
  return listAdminBookings(
    {
      ...parsed.data,
      limit: parsed.data.limit ?? 50,
    },
    auth.session.user,
  );
}

export async function handleAdminGetBooking(request: Request, bookingId: string) {
  const auth = await requireBookingAdmin(request);
  if (!auth.success) return auth.error;
  return getAdminBooking(bookingId, auth.session.user);
}

export async function handleAdminConfirmBooking(request: Request, bookingId: string) {
  return transitionFromRequest(request, bookingId, BookingStatus.CONFIRMED);
}

export async function handleAdminStartBooking(request: Request, bookingId: string) {
  return transitionFromRequest(request, bookingId, BookingStatus.IN_PROGRESS);
}

export async function handleAdminCompleteBooking(request: Request, bookingId: string) {
  return transitionFromRequest(request, bookingId, BookingStatus.COMPLETED);
}

export async function handleAdminNoShowBooking(request: Request, bookingId: string) {
  return transitionFromRequest(request, bookingId, BookingStatus.NO_SHOW);
}

async function listAdminBookings(
  input: AdminListBookingsQueryInput,
  admin: BookingAdminUser,
) {
  try {
    const branchId =
      admin.role === "SUPER_ADMIN" ? input.branchId : (admin.branchId ?? undefined);
    if (!branchId && admin.role !== "SUPER_ADMIN") {
      throw forbidden();
    }

    const bookings = await getDb().booking.findMany({
      orderBy: [{ bookingDate: "desc" }, { slotStart: "desc" }],
      select: bookingSelect(),
      take: input.limit,
      where: {
        bookingDate: input.date
          ? new Date(`${input.date}T00:00:00.000Z`)
          : undefined,
        branchId,
        status: input.status,
      },
    });

    return bookingJson({
      code: BOOKING_CODES.ADMIN_BOOKING_LIST_LOADED,
      data: { bookings: bookings.map(toPublicBooking), limit: input.limit },
      message: BOOKING_MESSAGES.ADMIN_BOOKING_LIST_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleAdminBookingError(error);
  }
}

async function getAdminBooking(bookingId: string, admin: BookingAdminUser) {
  try {
    const scope = await assertManageableBooking(bookingId, admin);
    const booking = await getDb().booking.findUniqueOrThrow({
      select: bookingSelect(),
      where: { id: scope.id },
    });
    return bookingJson({
      code: BOOKING_CODES.BOOKING_DETAIL_LOADED,
      data: { booking: toPublicBooking(booking) },
      message: BOOKING_MESSAGES.BOOKING_DETAIL_LOADED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleAdminBookingError(error);
  }
}

async function transitionFromRequest(request: Request, bookingId: string, nextStatus: BookingStatus) {
  const auth = await requireBookingAdmin(request);
  if (!auth.success) return auth.error;
  return transitionBooking(bookingId, nextStatus, auth.session.user);
}

async function transitionBooking(
  bookingId: string,
  nextStatus: BookingStatus,
  admin: { id: string; branchId?: string | null; role: string },
) {
  try {
    const current = await assertManageableBooking(bookingId, admin);
    if (!STATUS_TRANSITIONS[current.status]?.includes(nextStatus)) {
      throw invalidTransition();
    }

    const booking = await getDb().booking.update({
      data: {
        checkedInAt: nextStatus === BookingStatus.IN_PROGRESS ? new Date() : undefined,
        completedAt: nextStatus === BookingStatus.COMPLETED ? new Date() : undefined,
        pendingExpiresAt: nextStatus === BookingStatus.CONFIRMED ? null : undefined,
        status: nextStatus,
        statusHistory: {
          create: { changedById: admin.id, fromStatus: current.status, toStatus: nextStatus },
        },
      },
      select: bookingSelect(),
      where: { id: bookingId },
    });

    return bookingJson({
      code: BOOKING_CODES.BOOKING_STATUS_UPDATED,
      data: { booking: toPublicBooking(booking) },
      message: BOOKING_MESSAGES.BOOKING_STATUS_UPDATED,
      status: HTTP_STATUS.OK,
      success: true,
    });
  } catch (error) {
    return handleAdminBookingError(error);
  }
}

function forbidden() {
  return new BookingAdminError(
    BOOKING_CODES.INVALID_STATUS_TRANSITION,
    BOOKING_MESSAGES.INVALID_STATUS_TRANSITION,
    HTTP_STATUS.FORBIDDEN,
  );
}

function invalidTransition() {
  return new BookingAdminError(
    BOOKING_CODES.INVALID_STATUS_TRANSITION,
    BOOKING_MESSAGES.INVALID_STATUS_TRANSITION,
    HTTP_STATUS.CONFLICT,
  );
}
