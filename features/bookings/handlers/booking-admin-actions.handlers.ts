/**
 * Purpose: Admin booking action handlers for staff assignment and cancellation.
 * Responsibilities: authenticate admins, validate action payloads, enforce booking scope, and mutate booking status.
 * Important notes: assignment writes intentionally wait for booking and staff validation.
 */
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
  adminAssignStaffSchema,
  adminCancelBookingSchema,
} from "@/schema/bookings/schema.booking";
import {
  assertManageableBooking,
  BookingAdminError,
  handleAdminBookingError,
  parseBookingAdminBody,
  requireBookingAdmin,
} from "./booking-admin.shared";

export async function handleAdminAssignStaff(request: Request, bookingId: string) {
  const auth = await requireBookingAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseBookingAdminBody(request, adminAssignStaffSchema);
  if (body.error) return body.error;
  return assignStaff(bookingId, body.data.staffId, auth.session.user);
}

export async function handleAdminCancelBooking(request: Request, bookingId: string) {
  const auth = await requireBookingAdmin(request);
  if (!auth.success) return auth.error;
  const body = await parseBookingAdminBody(request, adminCancelBookingSchema);
  if (body.error) return body.error;
  return cancelBooking(bookingId, body.data.reason ?? null, auth.session.user);
}

async function assignStaff(bookingId: string, staffId: string, admin: { id: string; branchId?: string | null; role: string }) {
  try {
    // The booking update must wait until scope and staff-service validation both pass.
    // react-doctor-disable-next-line react-doctor/async-parallel
    const bookingScope = await assertManageableBooking(bookingId, admin);
    await assertStaffCanServe(staffId, bookingScope.branchId, bookingId);
    const booking = await getDb().booking.update({
      data: { staffId },
      select: bookingSelect(),
      where: { id: bookingId },
    });
    return ok(BOOKING_MESSAGES.BOOKING_STATUS_UPDATED, booking);
  } catch (error) {
    return handleAdminBookingError(error);
  }
}

async function cancelBooking(bookingId: string, reason: string | null, admin: { id: string; branchId?: string | null; role: string }) {
  try {
    const current = await assertManageableBooking(bookingId, admin);
    if (
      current.status === BookingStatus.COMPLETED ||
      current.status === BookingStatus.CANCELLED
    ) {
      throw invalidTransition();
    }
    const booking = await getDb().booking.update({
      data: {
        cancellationReason: reason,
        cancelledAt: new Date(),
        status: BookingStatus.CANCELLED,
        statusHistory: {
          create: { changedById: admin.id, fromStatus: current.status, reason, toStatus: BookingStatus.CANCELLED },
        },
      },
      select: bookingSelect(),
      where: { id: bookingId },
    });
    return ok(BOOKING_MESSAGES.BOOKING_CANCELLED, booking);
  } catch (error) {
    return handleAdminBookingError(error);
  }
}

async function assertStaffCanServe(staffId: string, branchId: string, bookingId: string) {
  const booking = await getDb().booking.findUnique({
    select: { serviceId: true },
    where: { id: bookingId },
  });
  const staff = await getDb().staff.findFirst({
    select: { id: true },
    where: {
      branchId,
      id: staffId,
      isAvailable: true,
      services: booking?.serviceId ? { some: { serviceId: booking.serviceId } } : undefined,
    },
  });
  if (!staff) throw new BookingAdminError(BOOKING_CODES.STAFF_NOT_FOUND, BOOKING_MESSAGES.STAFF_NOT_FOUND, HTTP_STATUS.NOT_FOUND);
}

function ok(message: string, booking: Parameters<typeof toPublicBooking>[0]) {
  return bookingJson({
    code: BOOKING_CODES.BOOKING_STATUS_UPDATED,
    data: { booking: toPublicBooking(booking) },
    message,
    status: HTTP_STATUS.OK,
    success: true,
  });
}

function invalidTransition() {
  return new BookingAdminError(
    BOOKING_CODES.INVALID_STATUS_TRANSITION,
    BOOKING_MESSAGES.INVALID_STATUS_TRANSITION,
    HTTP_STATUS.CONFLICT,
  );
}
